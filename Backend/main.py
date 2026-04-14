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
from rate_limiter import rate_limiter

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
from database import init_db
legal_ai: LegalAIApp | None = None

@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    """Initialize heavy resources (FAISS index + embedding model) once on startup."""
    # Initialize database schema
    try:
        init_db()
        print("[Startup] Database schema initialized.")
    except Exception as e:
        print(f"[Startup] Database initialization warning: {e}")
    
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


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8)
    confirm_password: Optional[str] = None

@app.put("/api/me")
def update_me(body: UpdateProfileRequest, current_user: str = Depends(get_current_user)):
    """Update the authenticated user's name and/or password."""
    conn = get_db()
    try:
        db_user = conn.execute(
            "SELECT email, name, password_hash FROM user_profile WHERE email = ?",
            (current_user,)
        ).fetchone()
    finally:
        conn.close()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    updates: Dict[str, Any] = {}

    # Name update
    if body.name is not None:
        stripped = body.name.strip()
        if not stripped:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        updates["name"] = stripped

    # Password update
    if body.new_password is not None:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not bcrypt.checkpw(body.current_password.encode('utf-8'), db_user["password_hash"].encode('utf-8')):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if body.new_password != body.confirm_password:
            raise HTTPException(status_code=400, detail="New password and confirmation do not match")
        updates["password_hash"] = bcrypt.hashpw(
            body.new_password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [current_user]
    conn = get_db()
    try:
        conn.execute(f"UPDATE user_profile SET {set_clause} WHERE email = ?", values)
        conn.commit()
        updated = conn.execute(
            "SELECT email, name FROM user_profile WHERE email = ?", (current_user,)
        ).fetchone()
    finally:
        conn.close()

    return {"email": updated["email"], "name": updated["name"], "message": "Profile updated successfully"}



MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
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
        
        # Increment documents processed counter
        try:
            conn = get_db()
            user = conn.execute("SELECT user_id FROM user_profile WHERE email = ?", (current_user,)).fetchone()
            conn.close()
            if user:
                rate_limiter.increment_documents_processed(user[0])
        except Exception as e:
            logger.warning(f"Could not increment documents processed: {e}")
        
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

    # Increment documents processed counter
    try:
        conn = get_db()
        user = conn.execute("SELECT user_id FROM user_profile WHERE email = ?", (current_user,)).fetchone()
        conn.close()
        if user:
            rate_limiter.increment_documents_processed(user[0])
            rate_limiter.increment_upload_count(user[0])
    except Exception as e:
        logger.warning(f"Could not increment counters: {e}")

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

# ────────────────────────────────────────────────────────────────────────────────
# SUBSCRIPTION AND RATE LIMITING ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────────

def get_user_id_from_token(token: str = Depends(oauth2_scheme)) -> int:
    """Extract user_id from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception

class SubscriptionPlan(BaseModel):
    name: str
    monthly_limit: Optional[int]
    price: float
    features: List[str]

class UserTierInfo(BaseModel):
    tier: str
    documents_uploaded: int
    monthly_limit: Optional[int]
    remaining: Optional[int]
    documents_processed: int = 0

class UploadCheckResponse(BaseModel):
    allowed: bool
    remaining: int
    tier: str
    message: str

class PaymentRequest(BaseModel):
    plan_name: str
    card_number: str = Field(..., description="Simulated - any 16 digit number")
    card_expiry: str = Field(..., description="Format: MM/YY")
    card_cvv: str = Field(..., description="3-4 digits")

class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    message: str
    new_tier: Optional[str] = None

@app.get("/api/subscription/plans", response_model=List[SubscriptionPlan])
def get_subscription_plans():
    """Get all available subscription plans."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name, monthly_limit, price, features FROM subscription_plans ORDER BY price")
        plans = cursor.fetchall()
        
        result = []
        for plan in plans:
            features = plan[3].split(',') if plan[3] else []
            result.append({
                'name': plan[0],
                'monthly_limit': plan[1],
                'price': plan[2],
                'features': features
            })
        return result
    finally:
        conn.close()

@app.get("/api/user/tier", response_model=UserTierInfo)
def get_user_tier(user_id: int = Depends(get_user_id_from_token)):
    """Get current user's subscription tier and usage information."""
    tier_info = rate_limiter.get_user_tier_info(user_id)
    
    if not tier_info:
        raise HTTPException(status_code=404, detail="User not found")
    
    remaining = tier_info['remaining']
    if remaining == float('inf'):
        remaining = None
    
    return {
        'tier': tier_info['tier'],
        'documents_uploaded': tier_info['documents_uploaded'],
        'monthly_limit': tier_info['monthly_limit'] if tier_info['monthly_limit'] != float('inf') else None,
        'remaining': remaining,
        'documents_processed': tier_info.get('documents_processed', 0)
    }

@app.get("/api/upload/check", response_model=UploadCheckResponse)
def check_upload_limit(user_id: int = Depends(get_user_id_from_token)):
    """Check if user can upload a document."""
    limit_check = rate_limiter.check_upload_limit(user_id)
    
    return {
        'allowed': limit_check['allowed'],
        'remaining': limit_check['remaining'] if limit_check['remaining'] != float('inf') else 999,
        'tier': limit_check['tier'],
        'message': limit_check['message']
    }

@app.post("/api/upload/document-with-limit")
@limiter.limit("30/minute")
async def upload_document_with_limit(
    request: Request,
    file: UploadFile = File(...),
    user_id: int = Depends(get_user_id_from_token)
):
    """Upload document with rate limiting enforcement."""
    
    # Check if user can upload
    limit_check = rate_limiter.check_upload_limit(user_id)
    
    if not limit_check['allowed']:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=limit_check['message']
        )
    
    # Process file
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
        # Increment the counter after successful upload
        rate_limiter.increment_upload_count(user_id)
        rate_limiter.increment_documents_processed(user_id)
        
        # Get updated tier info
        tier_info = rate_limiter.get_user_tier_info(user_id)
        
        return {
            'success': True,
            'message': 'Document uploaded successfully',
            'remaining': tier_info['remaining'] if tier_info['remaining'] != float('inf') else 999,
            'filename': file.filename
        }
    except Exception as e:
        logger.exception("Document upload failed")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")

@app.post("/api/subscription/checkout", response_model=PaymentResponse)
def process_payment(payment: PaymentRequest, user_id: int = Depends(get_user_id_from_token)):
    """
    Simulate payment processing and upgrade subscription tier.
    For demo purposes only - validates card format but doesn't charge.
    """
    
    # Validate card format (basic validation for demo)
    if not payment.card_number or len(payment.card_number) != 16 or not payment.card_number.isdigit():
        raise HTTPException(status_code=400, detail="Invalid card number")
    
    if not payment.card_expiry or len(payment.card_expiry.split('/')) != 2:
        raise HTTPException(status_code=400, detail="Invalid expiry format. Use MM/YY")
    
    if not payment.card_cvv or not (3 <= len(payment.card_cvv) <= 4 and payment.card_cvv.isdigit()):
        raise HTTPException(status_code=400, detail="Invalid CVV")
    
    if payment.plan_name not in ['free', 'premium']:
        raise HTTPException(status_code=400, detail="Invalid plan name")
    
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Get plan price
        cursor.execute("SELECT price FROM subscription_plans WHERE name = ?", (payment.plan_name,))
        plan = cursor.fetchone()
        
        if not plan:
            raise HTTPException(status_code=400, detail="Plan not found")
        
        price = plan[0]
        
        # Simulate successful payment
        transaction_id = f"SIM_{datetime.now().strftime('%Y%m%d%H%M%S')}_{user_id}"
        
        # Update user tier
        cursor.execute("""
            UPDATE user_profile
            SET subscription_tier = ?, documents_uploaded_this_month = 0, last_reset_date = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (payment.plan_name, user_id))
        
        # Record transaction
        cursor.execute("""
            INSERT INTO subscription_history (user_id, plan_name, amount, status)
            VALUES (?, ?, ?, 'completed')
        """, (user_id, payment.plan_name, price))
        
        conn.commit()
        
        message = f"Successfully upgraded to {payment.plan_name.upper()} plan"
        if payment.plan_name == 'free':
            message = "Downgraded to free plan"
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'message': message,
            'new_tier': payment.plan_name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Payment processing failed")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Payment processing failed")
    finally:
        conn.close()

@app.get("/api/subscription/history")
def get_subscription_history(user_id: int = Depends(get_user_id_from_token)):
    """Get user's subscription history."""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT transaction_id, plan_name, amount, status, transaction_date
            FROM subscription_history
            WHERE user_id = ?
            ORDER BY transaction_date DESC
        """, (user_id,))
        
        transactions = cursor.fetchall()
        
        result = []
        for tx in transactions:
            result.append({
                'transaction_id': tx[0],
                'plan_name': tx[1],
                'amount': tx[2],
                'status': tx[3],
                'transaction_date': tx[4]
            })
        
        return {'transactions': result}
    finally:
        conn.close()

# ── Notifications ─────────────────────────────────────────────────────────────

@app.get("/api/user/notifications")
def get_notifications(user_id: int = Depends(get_user_id_from_token)):
    """Get all non-dismissed notifications for the current user."""
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT notification_id, type, title, message, is_dismissed, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
            """,
            (user_id,)
        ).fetchall()
    finally:
        conn.close()

    return {
        "notifications": [
            {
                "id": r["notification_id"],
                "type": r["type"],
                "title": r["title"],
                "message": r["message"],
                "is_dismissed": bool(r["is_dismissed"]),
                "created_at": r["created_at"],
            }
            for r in rows
        ]
    }

@app.post("/api/user/notifications/{notification_id}/dismiss")
def dismiss_notification(
    notification_id: int,
    user_id: int = Depends(get_user_id_from_token)
):
    """Dismiss a notification by ID (must belong to the current user)."""
    conn = get_db()
    try:
        result = conn.execute(
            "UPDATE notifications SET is_dismissed = 1 WHERE notification_id = ? AND user_id = ?",
            (notification_id, user_id)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
    finally:
        conn.close()
    return {"success": True}


# ── Upload Cycle ───────────────────────────────────────────────────────────────

@app.get("/api/user/upload-cycle")
def get_upload_cycle(user_id: int = Depends(get_user_id_from_token)):
    """Return the current 14-day upload cycle timing for the user."""
    cycle = rate_limiter.get_upload_cycle(user_id)
    if cycle is None:
        raise HTTPException(status_code=404, detail="User not found")
    return cycle

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)