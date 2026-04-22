"""
rag/embedder.py
Converts text to vector embeddings using HuggingFace.
The model runs LOCALLY inside the Docker container — no API call needed.
"""


from __future__ import annotations
import os
from functools import lru_cache




@lru_cache(maxsize=1)   # Load the model once and reuse it
def _get_model():
    """Load the sentence-transformer model once."""
    from sentence_transformers import SentenceTransformer
    print("[Embedder] Loading sentence-transformer model (first time only)...")
    # This model is small (22MB) and runs entirely on CPU — no GPU needed
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")




def get_embedding(text: str) -> list[float] | None:
    """
    Convert a string of text into a list of 384 numbers (a vector).
    Returns None if something goes wrong.
    """
    if not text or not text.strip():
        return None
    try:
        model = _get_model()
        # encode() returns a numpy array — convert to plain Python list
        vector = model.encode(text, convert_to_tensor=False)
        return vector.tolist()
    except Exception as e:
        print(f"[Embedder] Error generating embedding: {e}")
        return None
