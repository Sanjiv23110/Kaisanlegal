import os
import io
import json
from groq import Groq
from pypdf import PdfReader
from docx import Document
from dotenv import load_dotenv

load_dotenv()

def read_pdf(file_bytes: bytes) -> str:
    text = ""
    reader = PdfReader(io.BytesIO(file_bytes))

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text.strip()

def read_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join([p.text for p in doc.paragraphs]).strip()


def read_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8").strip()


def load_document(file_bytes: bytes, file_name: str) -> str:

    if file_name.endswith(".pdf"):
        text = read_pdf(file_bytes)

    elif file_name.endswith(".docx"):
        text = read_docx(file_bytes)

    elif file_name.endswith(".txt"):
        text = read_txt(file_bytes)

    else:
        raise ValueError("Unsupported file type")

    if not text:
        raise ValueError("Document is empty")

    return text

def analyze_document(text: str) -> dict:

    api_key = os.getenv("GROQ_API_KEY") 

    if not api_key:
        raise EnvironmentError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    text = text[:12000]

    # UPDATE 1: The prompt's JSON structure now exactly matches 
    # your frontend's DocumentAnalysis TypeScript interface.
    prompt = f"""
You are an expert legal document analyst.

Evaluate the following document and extract the key information.
Return STRICT JSON only. Do not include markdown formatting or explanations. 
Your JSON must exactly match this structure:

{{
  "documentType": "string (e.g., 'Rental Agreement', 'Service Contract', etc.)",
  "keyDetails": [
    {{
      "label": "string (e.g., 'Document Date', 'Parties Involved')",
      "value": "string",
      "status": "string (You must choose exactly one: 'ok', 'missing', or 'warning')"
    }}
  ],
  "summary": "string (A concise summary of the document)",
  "redFlags": ["string (List of warnings, missing clauses, or risky terms)"],
  "credibilityScore": number (0 to 100),
  "suggestions": ["string (List of actionable steps to improve or fix the document)"]
}}

Document:
{text}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0,
        # UPDATE 2: Force Groq to return a valid JSON object
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )

    content = response.choices[0].message.content

    return json.loads(content)

def chat_with_groq(messages: list, document_context: dict = None) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    system_prompt = "You are an expert AI Legal Assistant. Provide clear, professional, and helpful legal guidance. Remember that you provide information, not formal legal advice."
    if document_context:
        system_prompt += f"\n\nThe user has uploaded a document for analysis. Here is the context summary:\n{json.dumps(document_context, indent=2)}\n\nUse this context to answer their questions accurately."

    formatted_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        formatted_messages.append({
            "role": "assistant" if msg["sender"] == "bot" else "user",
            "content": msg["message"]
        })

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        messages=formatted_messages,
    )

    return response.choices[0].message.content


def save_json(data: dict, file_name="analysis_output.json"):

    with open(file_name, "w") as f:
        json.dump(data, f, indent=4)


def save_markdown(data: dict, file_name="analysis_report.md"):

    md = f"""
# Document Analysis Report

## Summary
{data['summary']}

## Credibility Score
{data['credibility_score']}/100

## Key Points
"""

    for p in data["key_points"]:
        md += f"- {p}\n"

    md += "\n## Suggestions\n"

    for s in data["suggestions"]:
        md += f"- {s}\n"

    md += "\n## Red Flags Detected\n"

    for r in data["red_flags_detected"]:
        md += f"- {r}\n"

    with open(file_name, "w") as f:
        f.write(md)

if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv

    # Load environment variables from .env file
    load_dotenv()

    if len(sys.argv) < 2:
        print("Usage: python document_analyzer.py <file_path>")
        sys.exit(1)

    input_file = sys.argv[1]
    print(f"Loading document: {input_file}...")
    
    try:
        text = load_document(input_file)
        print("Analyzing document with Groq...")
        
        result = analyze_document(text)
        
        print("Saving results...")
        save_json(result)
        save_markdown(result)
        
        print("Done! Check 'analysis_output.json' and 'analysis_report.md'.")
    except Exception as e:
        print(f"Error: {e}")