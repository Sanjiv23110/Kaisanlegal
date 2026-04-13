import os
from fastapi import FastAPI, UploadFile, File, status, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from processor import load_document, analyze_document, chat_with_groq
from pydantic import BaseModel, Field
import bcrypt
from typing import List, Literal, Optional, Dict, Any
import sqlite3
import filetype
import logging
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_unsafe_key_for_dev_only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)

# ── Legal RAG ─────────────────────────────────────────────────────────────────
# Loaded once at startup, shared across all requests
from app import LegalAIApp
legal_ai: LegalAIApp | None = None

@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    """Initialize heavy resources (FAISS index + embedding model) once on startup."""
    # Run simple schema migrations
    try:
        conn = sqlite3.connect("local_datbase.db", timeout=15.0)
        try:
            conn.execute("ALTER TABLE user_profile ADD COLUMN name TEXT")
            conn.commit()
            print("[Startup] Added 'name' column to user_profile table.")
        except sqlite3.OperationalError:
            pass # Column already exists
        finally:
            conn.close()
    except Exception as e:
        print(f"[Startup] DB Schema init skipped/failed: {e}")

    global legal_ai
    print("[Startup] Loading Legal AI (FAISS + BAAI/bge-m3)...")
    legal_ai = LegalAIApp()
    print("[Startup] Legal AI ready.")
    yield
    print("[Shutdown] Legal AI unloaded.")

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return email

class userAuth(BaseModel):
    name: Optional[str] = Field(None, description="Full name of the user")
    email: str
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

class KeyDetail(BaseModel):
    label: str
    value: str
    status: Literal['ok', 'missing', 'warning']

class DocumentAnalysis(BaseModel):
    documentType: str
    keyDetails: List[KeyDetail]
    summary: str
    redFlags: List[str]
    credibilityScore: int
    suggestions: List[str]

# Helper function to get db connection
def get_db():
    conn = sqlite3.connect("local_datbase.db", timeout=15.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/api/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, user: userAuth):
    conn = get_db()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO user_profile (email, password_hash, name) VALUES(?, ?, ?)",
        (user.email, hashed_password, user.name)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()
        
    return {"message": "User created successfully"}

@app.post("/api/login")
@limiter.limit("5/minute")
def login(request: Request, user: userAuth):
    conn = get_db()
    try:
        db_user = conn.execute("SELECT * FROM user_profile WHERE email = ?", (user.email,)
        ).fetchone()
    finally:
        conn.close()

    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": db_user["user_id"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

class UserProfileResponse(BaseModel):
    email: str
    name: Optional[str]

@app.get("/api/me", response_model=UserProfileResponse)
def get_me(current_user: str = Depends(get_current_user)):
    conn = get_db()
    try:
        db_user = conn.execute("SELECT email, name FROM user_profile WHERE email = ?", (current_user,)).fetchone()
    finally:
        conn.close()
        
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"email": db_user["email"], "name": db_user["name"]}
    
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB
ALLOWED_MIMETYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
]

@app.post("/analyze", response_model=DocumentAnalysis)
@limiter.limit("10/minute")
async def process_document(request: Request, file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large. Limit is 10MB.")
        
    kind = filetype.guess(content)
    mime = kind.mime if kind else "text/plain"
    if mime not in ALLOWED_MIMETYPES:
        if not file.filename.endswith(".txt"):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Invalid file type.")

    try:
        raw_text = load_document(content, file.filename)
        summary = analyze_document(raw_text)
        return summary
    except Exception as e:
        logger.exception("Document processing failed")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")

@app.post("/api/analyze-legal")
@limiter.limit("10/minute")
async def analyze_legal(request: Request, file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    if not legal_ai:
        raise HTTPException(status_code=503, detail="Legal AI not initialized yet.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large. Limit is 10MB.")
    
    kind = filetype.guess(content)
    mime = kind.mime if kind else "text/plain"
    if mime not in ALLOWED_MIMETYPES:
        if not file.filename.endswith(".txt"):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Invalid file type.")

    try:
        raw_text = load_document(content, file.filename)
    except Exception as e:
        logger.exception("Text extraction failed")
        raise HTTPException(status_code=400, detail="Failed to extract text from document.")

    try:
        document_analysis = analyze_document(raw_text)
    except Exception as e:
        logger.exception("Document analysis failed")
        raise HTTPException(status_code=500, detail="An internal error occurred analyzing the document.")

    try:
        legal_compliance = legal_ai.analyze_document_with_rag(document_analysis, raw_text)
    except Exception as e:
        logger.exception("Legal compliance check failed")
        raise HTTPException(status_code=500, detail="An internal error occurred during compliance check.")

    return {
        "document_analysis": document_analysis,
        "legal_compliance":  legal_compliance,
    }

class ChatMessage(BaseModel):
    sender: str
    message: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    documentContext: Optional[Dict[str, Any]] = None

@app.post("/api/chat")
@limiter.limit("20/minute")
def process_chat(request: Request, chat_request: ChatRequest, current_user: str = Depends(get_current_user)):
    try:
        response_text = chat_with_groq(
            messages=[msg.model_dump() for msg in chat_request.messages] if hasattr(chat_request.messages[0], "model_dump") else [msg.dict() for msg in chat_request.messages],
            document_context=chat_request.documentContext
        )
        return {"reply": response_text}
    except Exception as e:
        logger.exception("Chat processing failed")
        raise HTTPException(status_code=500, detail="An internal error occurred processing chat.")

class LegalQueryRequest(BaseModel):
    query: str
    documentContext: Optional[str] = None

@app.post("/api/legal-query")
@limiter.limit("20/minute")
def legal_query(request: Request, req: LegalQueryRequest, current_user: str = Depends(get_current_user)):
    if not legal_ai:
        raise HTTPException(status_code=503, detail="Legal AI not initialized yet.")
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        # Explicit mode logging — check this in your uvicorn terminal to verify context state
        doc_ctx = req.documentContext or ""   # Always pass a string, never None
        if doc_ctx:
            logger.info(f"[LegalQuery] *** DOCUMENT CONTEXT MODE *** ({len(doc_ctx)} chars)")
        else:
            logger.info("[LegalQuery] === GENERAL MODE — No document context ===")

        answer = legal_ai.ask_question(req.query, document_context=doc_ctx)
        return {"answer": answer}
    except Exception as e:
        logger.exception("Legal query processing failed")
        raise HTTPException(status_code=500, detail="An internal error occurred processing legal query.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)