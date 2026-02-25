"""
Random Forest classifier for job matching.
Combines multiple matching signals (TF-IDF, SBERT, skills overlap, etc.)
into a single match probability using a trained Random Forest model.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score


class RFMatchClassifier:
    """
    Random Forest classifier that takes multiple matching features
    and produces a final match probability score.
    
    Features used:
    - skills_overlap: Jaccard similarity of skill tags
    - tfidf_score: TF-IDF cosine similarity
    - sbert_score: SBERT semantic similarity  
    - experience_match: Whether experience level matches
    - job_type_match: Whether job type aligns with student preferences
    """

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        self.is_trained = False
        self.feature_names = [
            "skills_overlap",
            "tfidf_score",
            "sbert_score",
            "experience_match",
            "job_type_match",
        ]
        self._train_on_synthetic_data()

    def _train_on_synthetic_data(self):
        """
        Train the model on synthetic data since we don't have historical
        application/hiring data yet. The synthetic data encodes domain 
        knowledge about what makes a good job match.
        """
        np.random.seed(42)
        n_samples = 2000

        # Generate synthetic features
        skills_overlap = np.random.beta(2, 5, n_samples)     # Most overlaps are low
        tfidf_score = np.random.beta(2, 3, n_samples)        # Moderate distribution
        sbert_score = np.random.beta(2, 3, n_samples)        # Moderate distribution
        experience_match = np.random.binomial(1, 0.4, n_samples).astype(float)
        job_type_match = np.random.binomial(1, 0.5, n_samples).astype(float)

        X = np.column_stack([
            skills_overlap,
            tfidf_score,
            sbert_score,
            experience_match,
            job_type_match,
        ])

        # Generate labels based on logical rules (domain knowledge)
        # A good match has high skills overlap + at least one strong text similarity
        match_score = (
            0.35 * skills_overlap +
            0.20 * tfidf_score +
            0.25 * sbert_score +
            0.10 * experience_match +
            0.10 * job_type_match
        )

        # Add noise for realism
        noise = np.random.normal(0, 0.05, n_samples)
        match_score = np.clip(match_score + noise, 0, 1)

        # Threshold: >0.35 is a "good match"
        y = (match_score > 0.35).astype(int)

        # Train
        self.model.fit(X, y)
        self.is_trained = True

        # Report training quality
        cv_scores = cross_val_score(self.model, X, y, cv=5, scoring="accuracy")
        print(f"✅ Random Forest trained on {n_samples} synthetic samples")
        print(f"   Cross-validation accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
        print(f"   Feature importances: {dict(zip(self.feature_names, self.model.feature_importances_.round(3)))}")

    def predict_match(self, features: dict) -> dict:
        """
        Predict match probability for a single student-job pair.
        
        Args:
            features: Dict with keys matching self.feature_names
            
        Returns:
            Dict with 'match_probability', 'is_good_match', 'feature_contributions'
        """
        if not self.is_trained:
            return {"match_probability": 0.0, "is_good_match": False, "feature_contributions": {}}

        X = np.array([[features.get(f, 0.0) for f in self.feature_names]])
        
        probability = self.model.predict_proba(X)[0][1]  # Probability of class 1 (good match)
        is_good_match = probability >= 0.5

        # Feature contribution analysis (using feature importances as proxy)
        contributions = {}
        for i, fname in enumerate(self.feature_names):
            importance = self.model.feature_importances_[i]
            value = features.get(fname, 0.0)
            contributions[fname] = round(importance * value, 4)

        return {
            "match_probability": round(float(probability), 4),
            "is_good_match": bool(is_good_match),
            "feature_contributions": contributions,
        }

    def predict_batch(self, feature_list: list[dict]) -> list[dict]:
        """Predict match probabilities for multiple student-job pairs."""
        return [self.predict_match(f) for f in feature_list]
