"""
SBERT (Sentence-BERT) based semantic similarity matching.
Uses pre-trained sentence transformers to compute deep semantic
similarity between student profiles and job descriptions.
"""

import numpy as np

# Try to import sentence-transformers; fall back to TF-IDF if unavailable
try:
    from sentence_transformers import SentenceTransformer
    SBERT_AVAILABLE = True
except ImportError:
    SBERT_AVAILABLE = False
    print("⚠️  sentence-transformers not installed. Using fallback TF-IDF for semantic matching.")


class SBERTMatcher:
    """
    Computes semantic similarity using Sentence-BERT embeddings.
    Falls back to basic keyword overlap if SBERT model is not available.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize SBERT model.
        
        Args:
            model_name: HuggingFace model name. 'all-MiniLM-L6-v2' is a good
                       balance of speed and quality (80MB, 384-dim embeddings).
        """
        self.model = None
        self.model_name = model_name
        
        if SBERT_AVAILABLE:
            try:
                print(f"🔄 Loading SBERT model: {model_name}...")
                self.model = SentenceTransformer(model_name)
                print(f"✅ SBERT model loaded successfully!")
            except Exception as e:
                print(f"⚠️  Failed to load SBERT model: {e}")
                self.model = None

    @property
    def is_available(self) -> bool:
        return self.model is not None

    def encode(self, texts: list[str]) -> np.ndarray:
        """Encode texts into embeddings."""
        if not self.is_available:
            return np.array([])
        return self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)

    def compute_similarity(self, profile_text: str, job_texts: list[str]) -> list[float]:
        """
        Compute semantic similarity between a student profile and multiple jobs.
        
        Uses cosine similarity on SBERT embeddings for deep semantic understanding.
        Unlike TF-IDF, this captures meaning even when different words are used.
        E.g., "Python developer" and "software engineer using Python" score high.
        
        Args:
            profile_text: Combined student profile text
            job_texts: List of combined job description texts
            
        Returns:
            List of similarity scores between 0 and 1
        """
        if not self.is_available:
            return self._fallback_similarity(profile_text, job_texts)
        
        if not profile_text or not job_texts:
            return [0.0] * len(job_texts) if job_texts else []

        try:
            # Encode profile and all jobs
            profile_embedding = self.model.encode([profile_text], normalize_embeddings=True)
            job_embeddings = self.model.encode(job_texts, normalize_embeddings=True)
            
            # Cosine similarity (embeddings are normalized, so dot product = cosine sim)
            similarities = np.dot(job_embeddings, profile_embedding.T).flatten()
            
            # Clamp to [0, 1]
            similarities = np.clip(similarities, 0, 1)
            return similarities.tolist()
        except Exception as e:
            print(f"SBERT error: {e}")
            return self._fallback_similarity(profile_text, job_texts)

    def compute_single_similarity(self, text_a: str, text_b: str) -> float:
        """Compute semantic similarity between two texts."""
        scores = self.compute_similarity(text_a, [text_b])
        return scores[0] if scores else 0.0

    def _fallback_similarity(self, profile_text: str, job_texts: list[str]) -> list[float]:
        """
        Simple keyword overlap fallback when SBERT is not available.
        Uses Jaccard similarity on word sets.
        """
        if not profile_text or not job_texts:
            return [0.0] * len(job_texts) if job_texts else []
        
        profile_words = set(profile_text.lower().split())
        scores = []
        
        for job_text in job_texts:
            job_words = set(job_text.lower().split())
            if not profile_words or not job_words:
                scores.append(0.0)
                continue
            intersection = profile_words & job_words
            union = profile_words | job_words
            scores.append(len(intersection) / len(union) if union else 0.0)
        
        return scores
