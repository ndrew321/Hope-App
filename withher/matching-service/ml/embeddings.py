from functools import lru_cache
from typing import Iterable, List

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def encode_texts(texts: Iterable[str]) -> np.ndarray:
    model = get_model()
    text_list: List[str] = [t if t else "" for t in texts]
    if not text_list:
        return np.zeros((0, 384), dtype=np.float32)
    embeddings = model.encode(text_list, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype(np.float32)


def encode_single(text: str) -> np.ndarray:
    arr = encode_texts([text])
    return arr[0] if arr.shape[0] else np.zeros((384,), dtype=np.float32)
