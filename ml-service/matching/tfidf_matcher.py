"""
TF-IDF based text similarity matching.
Uses TF-IDF vectorization + cosine similarity to compare
student profiles against job descriptions.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


class TFIDFMatcher:
    """
    Computes text similarity between student profile text and job descriptions
    using TF-IDF (Term Frequency–Inverse Document Frequency) vectorization.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=5000,
            ngram_range=(1, 2),  # unigrams and bigrams
            min_df=1,
            max_df=0.95,
        )

    def compute_similarity(self, profile_text: str, job_texts: list[str]) -> list[float]:
        """
        Compute cosine similarity between a student profile and multiple job descriptions.
        
        Args:
            profile_text: Combined text from student profile (bio, skills, education, experience)
            job_texts: List of combined job description texts
            
        Returns:
            List of similarity scores between 0 and 1
        """
        if not profile_text or not job_texts:
            return [0.0] * len(job_texts) if job_texts else []

        # Combine profile + all jobs for fitting
        all_texts = [profile_text] + job_texts

        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            
            # Profile is first row, jobs are the rest
            profile_vector = tfidf_matrix[0:1]
            job_vectors = tfidf_matrix[1:]
            
            similarities = cosine_similarity(profile_vector, job_vectors).flatten()
            return similarities.tolist()
        except Exception as e:
            print(f"TF-IDF error: {e}")
            return [0.0] * len(job_texts)

    def compute_single_similarity(self, text_a: str, text_b: str) -> float:
        """Compute similarity between two texts."""
        scores = self.compute_similarity(text_a, [text_b])
        return scores[0] if scores else 0.0

    def get_top_keywords(self, text: str, n: int = 10) -> list[tuple[str, float]]:
        """
        Extract top TF-IDF keywords from a text.
        
        Returns:
            List of (keyword, tfidf_score) tuples
        """
        try:
            tfidf_matrix = self.vectorizer.fit_transform([text])
            feature_names = self.vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray().flatten()
            
            top_indices = scores.argsort()[-n:][::-1]
            return [(feature_names[i], float(scores[i])) for i in top_indices if scores[i] > 0]
        except Exception:
            return []
