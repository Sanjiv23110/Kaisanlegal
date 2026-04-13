import os
from groq import Groq
from dotenv import load_dotenv
from retriever import LegalRetriever

# Load environment variables (.env should contain GROQ_API_KEY)
load_dotenv()

class LegalAIApp:
    def __init__(self):
        print("Initializing Legal AI Backend...")
        # 1. Connect to the FAISS Database via Retriever
        self.retriever = LegalRetriever()
        
        # 2. Connect to Groq API
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_actual_groq_api_key_here":
            raise EnvironmentError("Valid GROQ_API_KEY not found in .env file.")
        
        self.groq_client = Groq(api_key=api_key)
        # Using llama-3.3-70b-versatile for high quality, or llama3-8b-8192 for speed
        self.model_name = "llama-3.3-70b-versatile"

    def ask_question(self, query: str, document_context: str = ""):
        print("\n🔍 Fetching relevant legal statutes from FAISS index...")
        
        # 1. Retrieve Context from FAISS
        # Returns: list of {"document": str, "metadata": dict, "score": float}
        search_results = self.retriever.search_legal_context(query, top_k=3)
        
        contexts = []
        references = []

        for i, result in enumerate(search_results):
            doc  = result["document"]
            meta = result["metadata"]
            score = result["score"]

            contexts.append(f"--- Source {i+1} (relevance: {score:.3f}) ---\n{doc}")

            # Build citation from FAISS metadata keys
            act_id  = meta.get("act_id", "")
            section = meta.get("section_number", "")
            heading = meta.get("heading", "")
            source  = meta.get("source_file", f"Document {i+1}")

            citation = source
            if act_id and section:
                citation = f"{act_id} § {section}"
                if heading:
                    citation += f" — {heading[:60]}"
            elif section:
                citation = f"Section {section} ({source})"

            references.append(citation)

        compiled_context = "\n\n".join(contexts) if contexts else "No relevant legal context found."
        
        system_prompt = (
            "You are HybridLex, an expert Legal AI specializing in Indian law — "
            "the Constitution, BNS (Bharatiya Nyaya Sanhita), BNSS, BSA, and related statutes. "
            "You operate in two layers:\n"
            "LAYER 1 — RETRIEVED CONTEXT: You have been given passages from a FAISS legal database. "
            "Prioritize these for your answer when they are relevant.\n"
            "LAYER 2 — GENERAL LEGAL KNOWLEDGE: If the retrieved passages do NOT contain "
            "the answer, use your own training knowledge of Indian law to give a correct, "
            "helpful answer. Do NOT say 'I don't know' if you can answer from your legal knowledge.\n"
            "RULES:\n"
            "- Always be precise, professional, and cite specific acts/sections when possible.\n"
            "- If you use LAYER 1, start your answer with: [From Legal Database]\n"
            "- If you use LAYER 2, start your answer with: [From General Legal Knowledge]\n"
            "- Never fabricate sections that don't exist in Indian law."
        )
        
        if document_context:
            system_prompt = (
                "You are HybridLex, an expert Legal AI specializing in Indian law. "
                "The user has uploaded a document for analysis. You have access to:\n"
                "1) An uploaded document's analysis (summary, red flags, compliance report) — treat this as primary context\n"
                "2) Retrieved Indian legal passages from the FAISS database\n"
                "3) Your own training knowledge of Indian law as a final fallback\n"
                "Answer questions about the document using all three sources. "
                "Be explicit: prefix answers with [From Document], [From Legal Database], or [From Legal Knowledge] "
                "depending on which source you used. Never fabricate law."
                f"\n\n=== UPLOADED DOCUMENT ANALYSIS ===\n{document_context}"
            )
        
        user_prompt = f"Context:\n{compiled_context}\n\nUser Question:\n{query}"
        
        # 3. Call Groq
        print("🧠 Processing Hybrid Response with Groq (Llama-3)...")
        response = self.groq_client.chat.completions.create(
            model=self.model_name,
            temperature=0.1,  # Low temperature to prevent hallucinations
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        answer = response.choices[0].message.content
        
        # 4. Append Citations / References directly into output
        if references:
            answer += "\n\n**References consulted:**\n"
            # remove duplicates while maintaining order
            unique_refs = list(dict.fromkeys(references))
            for ref in unique_refs:
                answer += f"- {ref}\n"
                
        return answer

    def analyze_document_with_rag(self, document_analysis: dict, raw_text: str) -> dict:
        """
        4-step RAG pipeline for document legal compliance checking.

        Step 1: Extract key legal concerns from the existing document_analysis
                (already produced by processor.analyze_document).
        Step 2: Build a focused FAISS search query from document summary + red flags.
        Step 3: Retrieve the top 5 most relevant Indian laws from FAISS.
        Step 4: Ask Groq to identify violations/compliance issues using ONLY
                the retrieved laws as ground truth.

        Returns a dict with: compliance_report, cited_laws, compliance_score
        """
        print("\n📄 Starting Document Legal Compliance Analysis...")

        # ── Step 1: Extract concerns from existing analysis ──────────────────
        doc_type   = document_analysis.get("documentType", "Unknown Document")
        summary    = document_analysis.get("summary", "")
        red_flags  = document_analysis.get("redFlags", [])
        suggestions = document_analysis.get("suggestions", [])

        # ── Step 2: Build focused FAISS search query ──────────────────────────
        # Combine document type + summary + top red flags for a legally precise query
        red_flag_text = "; ".join(red_flags[:4]) if red_flags else "none identified"
        faiss_query = (
            f"Legal requirements and violations related to: {doc_type}. "
            f"Document context: {summary[:400]}. "
            f"Potential concerns: {red_flag_text}"
        )
        print(f"🔍 FAISS Query: {faiss_query[:120]}...")

        # ── Step 3: Retrieve relevant laws from FAISS ─────────────────────────
        search_results = self.retriever.search_legal_context(faiss_query, top_k=5)

        cited_laws = []
        law_context_blocks = []

        for i, result in enumerate(search_results):
            doc    = result["document"]
            meta   = result["metadata"]
            score  = result["score"]

            act_id  = meta.get("act_id", "")
            section = meta.get("section_number", "")
            heading = meta.get("heading", "")
            source  = meta.get("source_file", f"Source {i+1}")

            if act_id and section:
                citation = f"{act_id} § {section}"
                if heading:
                    citation += f" — {heading[:80]}"
            else:
                citation = f"Section {section} ({source})" if section else source

            law_context_blocks.append(
                f"[Law {i+1}] {citation} (relevance score: {score:.3f})\n{doc}"
            )
            cited_laws.append({
                "citation": citation,
                "excerpt":  doc[:300],
                "score":    round(score, 4),
                "source":   source,
            })

        laws_context = "\n\n".join(law_context_blocks) if law_context_blocks \
                       else "No highly relevant laws found in the database."

        # ── Step 4: Groq compliance analysis ─────────────────────────────────
        system_prompt = (
            "You are a senior Indian legal compliance expert. "
            "Your task is to analyze a document for potential legal violations or compliance issues "
            "using ONLY the Indian laws retrieved from the legal database below. "
            "Do NOT reference laws, articles, or sections that are not in the provided context. "
            "Structure your response with clear sections: "
            "1) COMPLIANCE SUMMARY, 2) POTENTIAL VIOLATIONS, 3) COMPLIANT ASPECTS, "
            "4) RECOMMENDED ACTIONS. Be specific about which law and section applies."
        )

        user_prompt = (
            f"=== RETRIEVED INDIAN LAWS (use ONLY these) ===\n"
            f"{laws_context}\n\n"
            f"=== DOCUMENT BEING ANALYZED ===\n"
            f"Type: {doc_type}\n"
            f"Summary: {summary}\n"
            f"Red Flags Identified: {red_flag_text}\n"
            f"Suggestions from initial analysis: {'; '.join(suggestions[:3])}\n\n"
            f"=== DOCUMENT EXCERPT (first 2000 chars) ===\n"
            f"{raw_text[:2000]}\n\n"
            f"=== TASK ===\n"
            f"Based ONLY on the retrieved Indian laws above, identify:\n"
            f"1. Which specific articles/sections this document may violate and why.\n"
            f"2. Which aspects of the document are legally compliant.\n"
            f"3. Concrete steps to ensure full legal compliance.\n"
            f"If a concern cannot be mapped to a retrieved law, say 'No retrieved law covers this'."
        )

        print("🧠 Running Groq compliance analysis...")
        response = self.groq_client.chat.completions.create(
            model=self.model_name,
            temperature=0.1,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ]
        )

        compliance_report = response.choices[0].message.content

        return {
            "compliance_report": compliance_report,
            "cited_laws":        cited_laws,
            "laws_searched":     len(search_results),
        }

if __name__ == "__main__":
    try:
        app = LegalAIApp()
        
        print("\n==================================")
        print("🏛️ INDIAN CONSTITUTION RAG AI 🏛️")
        print("==================================")
        print("Type 'exit' to quit at any time.\n")
        
        while True:
            user_input = input("Enter your legal query: ")
            
            if user_input.lower() in ['exit', 'quit', 'q']:
                break
                
            if not user_input.strip():
                continue
                
            answer = app.ask_question(user_input)
            
            print("\n----- AI LAWYER RESPONSE -----")
            print(answer)
            print("------------------------------\n")
            
    except Exception as e:
        print(f"\n[ERROR] Failed to start standard app: {e}")
        print("Please make sure you have set a valid GROQ_API_KEY in the .env file.")
