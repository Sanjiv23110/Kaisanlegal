"""
Legal RAG Retriever — BAAI/bge-m3 + FAISS
==========================================
Replaces ChromaDB with FAISS (Facebook AI Similarity Search) to avoid
DLL initialization issues with onnxruntime/Rust backends on Windows.

Persistence:
  chroma_db/          (renamed to faiss_db/ for clarity — but kept as chroma_db
                       so existing code paths don't break)
  faiss_db/faiss.index  — the FAISS binary index
  faiss_db/metadata.json — parallel array of metadata dicts
  faiss_db/documents.json — parallel array of raw text documents
"""

import os
import json
import numpy as np
import pandas as pd
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

try:
    import faiss
except ImportError:
    raise ImportError(
        "FAISS is not installed. Run: python.exe -m pip install faiss-cpu"
    )

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
EMBED_DIM = 1024          # BAAI/bge-m3 embedding dimension
ENCODE_BATCH = 8          # Docs per encoding call (keeps RAM under control)
DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "faiss_db")


# ─────────────────────────────────────────────────────────────────────────────
# Retriever
# ─────────────────────────────────────────────────────────────────────────────
class LegalRetriever:
    """
    Loads BAAI/bge-m3, builds/loads a FAISS index, and provides
    ingestion + similarity search over Indian legal statutes.
    """

    def __init__(self, db_path: str = DEFAULT_DB_PATH, model_name: str = "BAAI/bge-m3"):
        self.db_path = db_path
        os.makedirs(db_path, exist_ok=True)

        self.index_file = os.path.join(db_path, "faiss.index")
        self.meta_file  = os.path.join(db_path, "metadata.json")
        self.docs_file  = os.path.join(db_path, "documents.json")

        print(f"Loading embedding model {model_name}...")
        self.model = SentenceTransformer(model_name)

        # Load or create FAISS index (cosine similarity via L2 on normalized vecs)
        if os.path.exists(self.index_file):
            print(f"Loading existing FAISS index from {self.index_file}...")
            self.index = faiss.read_index(self.index_file)
            with open(self.meta_file,  "r", encoding="utf-8") as f:
                self.metadatas = json.load(f)
            with open(self.docs_file, "r", encoding="utf-8") as f:
                self.documents = json.load(f)
            print(f"Index loaded. Total vectors: {self.index.ntotal}")
        else:
            print("No existing index found — creating fresh FAISS index.")
            self.index     = faiss.IndexFlatIP(EMBED_DIM)  # Inner Product on L2-normed = cosine
            self.metadatas = []
            self.documents = []

    # ── Encoding ──────────────────────────────────────────────────────────────
    def _encode(self, texts: list[str]) -> np.ndarray:
        """Encode texts in small sub-batches and return a float32 numpy array."""
        all_embs = []
        for i in range(0, len(texts), ENCODE_BATCH):
            chunk = texts[i:i + ENCODE_BATCH]
            embs = self.model.encode(
                chunk,
                normalize_embeddings=True,   # L2-norm → cosine sim via inner product
                convert_to_tensor=False,
                show_progress_bar=False,
            )
            all_embs.append(embs)
        return np.vstack(all_embs).astype("float32")

    # ── Save ──────────────────────────────────────────────────────────────────
    def _save(self):
        faiss.write_index(self.index, self.index_file)
        with open(self.meta_file,  "w", encoding="utf-8") as f:
            json.dump(self.metadatas, f, ensure_ascii=False)
        with open(self.docs_file, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False)

    # ── Batch add ─────────────────────────────────────────────────────────────
    def _batch_add(self, docs: list[str], metas: list[dict]):
        if not docs:
            return
        print(f"  Encoding {len(docs)} documents in batches of {ENCODE_BATCH}...")
        n_batches = (len(docs) + ENCODE_BATCH - 1) // ENCODE_BATCH
        all_embs = []
        for i in tqdm(range(n_batches), desc="  Encoding", unit="batch"):
            start = i * ENCODE_BATCH
            chunk = docs[start:start + ENCODE_BATCH]
            embs = self.model.encode(
                chunk,
                normalize_embeddings=True,
                convert_to_tensor=False,
                show_progress_bar=False,
            )
            all_embs.append(embs)

        embeddings = np.vstack(all_embs).astype("float32")
        self.index.add(embeddings)
        self.documents.extend(docs)
        self.metadatas.extend(metas)

        print(f"  Added {len(docs)} vectors. Index total: {self.index.ntotal}")
        self._save()

    # ── Directory ingestion ───────────────────────────────────────────────────
    def ingest_directory(self, data_dir: str):
        SKIP_FOLDERS = {"catalog"}
        print(f"\nScanning directory: {data_dir}")
        for root, dirs, files in os.walk(data_dir):
            dirs[:] = [d for d in dirs if d not in SKIP_FOLDERS]
            for file in sorted(files):
                fpath = os.path.join(root, file)
                if file.endswith(".csv"):
                    self._ingest_csv(fpath)
                elif file.endswith(".json"):
                    self._ingest_json(fpath)
                elif file.endswith(".jsonl"):
                    self._ingest_jsonl(fpath)

    def _ingest_csv(self, file_path: str):
        print(f"\nIngesting CSV: {file_path}")
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            print(f"  [SKIP] Failed to read: {e}")
            return

        docs, metas = [], []
        for i, row in df.iterrows():
            row_dict = row.dropna().to_dict()
            if "article_desc" in row_dict:
                text = str(row_dict.pop("article_desc"))
            elif "text" in row_dict:
                text = str(row_dict.pop("text"))
            else:
                text = " | ".join(f"{k}: {v}" for k, v in row_dict.items())

            meta = {str(k): str(v) for k, v in row_dict.items()}
            meta["source_file"] = os.path.basename(file_path)
            docs.append(text)
            metas.append(meta)

        self._batch_add(docs, metas)

    def _ingest_json(self, file_path: str):
        print(f"\nIngesting JSON: {file_path}")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"  [SKIP] Failed to load: {e}")
            return

        if isinstance(data, dict):
            sections = data.get("sections", [])
            act_id   = data.get("act_id", os.path.basename(file_path))
        elif isinstance(data, list):
            sections = data
            act_id   = os.path.basename(file_path)
        else:
            print(f"  [SKIP] Unsupported JSON structure.")
            return

        docs, metas = [], []
        for i, item in enumerate(sections):
            heading   = item.get("heading", "")
            text_body = item.get("text", "") or item.get("description", "")
            if not text_body:
                text_body = json.dumps(item, ensure_ascii=False)[:500]

            text = f"Section {item.get('section_number', i)}: {heading}\n\n{text_body}".strip()
            meta = {
                "source_file":    os.path.basename(file_path),
                "act_id":         str(act_id),
                "section_number": str(item.get("section_number", i)),
                "heading":        heading[:200],
            }
            docs.append(text)
            metas.append(meta)

        self._batch_add(docs, metas)

    def _ingest_jsonl(self, file_path: str):
        print(f"\nIngesting JSONL: {file_path}")
        docs, metas = [], []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f):
                    if not line.strip():
                        continue
                    item    = json.loads(line)
                    heading = item.get("heading_en", item.get("heading", ""))
                    text_b  = item.get("text_en",    item.get("text",    ""))
                    text    = f"Section {item.get('section_number', i)}: {heading}\n\n{text_b}".strip()
                    meta    = {
                        "source_file":    os.path.basename(file_path),
                        "act_id":         str(item.get("act_id", "")),
                        "section_number": str(item.get("section_number", i)),
                        "heading":        heading[:200],
                    }
                    docs.append(text)
                    metas.append(meta)
        except Exception as e:
            print(f"  [SKIP] Failed to read: {e}")
            return

        self._batch_add(docs, metas)

    # ── Search ────────────────────────────────────────────────────────────────
    def search_legal_context(self, query: str, top_k: int = 3) -> list[dict]:
        """
        Returns top_k most relevant legal sections.
        Each result: {"document": str, "metadata": dict, "score": float}
        """
        if self.index.ntotal == 0:
            return []

        query_vec = self._encode([query])
        scores, indices = self.index.search(query_vec, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append({
                "document": self.documents[idx],
                "metadata": self.metadatas[idx],
                "score":    float(score),
            })
        return results


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    retriever = LegalRetriever()

    if retriever.index.ntotal > 0:
        print(f"\nDB already contains {retriever.index.ntotal} vectors. Skipping ingestion.")
        print("Delete the 'faiss_db/' folder to force re-ingestion.\n")

        # Quick test query
        results = retriever.search_legal_context("Right to equality", top_k=3)
        print("=== Test Query: 'Right to equality' ===")
        for i, r in enumerate(results, 1):
            print(f"\n[{i}] Score: {r['score']:.4f}")
            print(f"     Source: {r['metadata'].get('source_file')} | "
                  f"Section: {r['metadata'].get('section_number')}")
            print(f"     {r['document'][:200]}...")
    else:
        data_dir = os.path.normpath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
        )
        print(f"\nStarting ingestion from: {data_dir}")
        retriever.ingest_directory(data_dir)
        print(f"\n✅ Ingestion Complete! Total vectors in index: {retriever.index.ntotal}")
