"""
Job Matching Engine - Orchestrates all ML components.
Combines TF-IDF, SBERT, and Random Forest into a unified matching pipeline.
"""

from .tfidf_matcher import TFIDFMatcher
from .sbert_matcher import SBERTMatcher
from .rf_classifier import RFMatchClassifier


class MatchingEngine:
    """
    Main orchestrator that combines:
    1. Skills overlap (Jaccard similarity on skill tags)
    2. TF-IDF text similarity (profile text vs job description)
    3. SBERT semantic similarity (deep meaning comparison)
    4. Random Forest final scoring (combines all signals)
    """

    def __init__(self):
        print("🚀 Initializing Job Matching Engine...")
        self.tfidf = TFIDFMatcher()
        self.sbert = SBERTMatcher()
        self.rf = RFMatchClassifier()
        print("✅ Matching Engine ready!")

    def _compute_skills_overlap(self, student_skills: list[str], job_skills: list[str]) -> float:
        """
        Jaccard similarity between student skills and required job skills.
        """
        if not student_skills or not job_skills:
            return 0.0
        
        student_set = set(s.lower().strip() for s in student_skills)
        job_set = set(s.lower().strip() for s in job_skills)
        
        intersection = student_set & job_set
        union = student_set | job_set
        
        return len(intersection) / len(union) if union else 0.0

    def _compute_skills_coverage(self, student_skills: list[str], job_skills: list[str]) -> float:
        """
        What percentage of required job skills does the student have?
        """
        if not job_skills:
            return 0.0
        
        student_set = set(s.lower().strip() for s in student_skills)
        job_set = set(s.lower().strip() for s in job_skills)
        
        matched = student_set & job_set
        return len(matched) / len(job_set)

    def _get_missing_skills(self, student_skills: list[str], job_skills: list[str]) -> list[str]:
        """Get skills required by job that student doesn't have."""
        student_set = set(s.lower().strip() for s in student_skills)
        job_set = set(s.lower().strip() for s in job_skills)
        return list(job_set - student_set)

    def _get_matching_skills(self, student_skills: list[str], job_skills: list[str]) -> list[str]:
        """Get skills that match between student and job."""
        student_set = set(s.lower().strip() for s in student_skills)
        job_set = set(s.lower().strip() for s in job_skills)
        return list(student_set & job_set)

    def _build_profile_text(self, profile: dict) -> str:
        """Combine student profile fields into a single text for NLP matching."""
        parts = []
        if profile.get("bio"):
            parts.append(profile["bio"])
        if profile.get("skills"):
            parts.append("Skills: " + ", ".join(profile["skills"]))
        if profile.get("education"):
            parts.append("Education: " + profile["education"])
        if profile.get("experience"):
            parts.append("Experience: " + profile["experience"])
        return " ".join(parts)

    def _build_job_text(self, job: dict) -> str:
        """Combine job fields into a single text for NLP matching."""
        parts = []
        if job.get("title"):
            parts.append(job["title"])
        if job.get("description"):
            parts.append(job["description"])
        if job.get("skills_required"):
            parts.append("Required skills: " + ", ".join(job["skills_required"]))
        if job.get("experience_level"):
            parts.append("Experience level: " + job["experience_level"])
        if job.get("job_type"):
            parts.append("Job type: " + job["job_type"])
        return " ".join(parts)

    def _experience_match(self, profile: dict, job: dict) -> float:
        """
        Heuristic: check if student experience aligns with job level.
        """
        experience_text = (profile.get("experience") or "").lower()
        job_level = (job.get("experience_level") or "").lower()

        if not job_level or job_level == "entry":
            return 1.0  # Entry level matches everyone

        level_keywords = {
            "mid": ["2 years", "3 years", "4 years", "mid", "intermediate", "professional"],
            "senior": ["5 years", "6 years", "7 years", "8 years", "senior", "lead", "principal"],
            "executive": ["10 years", "director", "executive", "vp", "chief", "head of"],
        }

        if job_level in level_keywords:
            for keyword in level_keywords[job_level]:
                if keyword in experience_text:
                    return 1.0
            return 0.3  # Partial match - they might still be suitable

        return 0.5

    def _job_type_match(self, profile: dict, job: dict) -> float:
        """Simple job type preference matching."""
        # For now, assume all job types are acceptable (no preference data in profiles yet)
        return 0.7

    def match_profile_to_jobs(self, profile: dict, jobs: list[dict]) -> list[dict]:
        """
        Main matching method. Match a student profile against multiple jobs.
        
        Args:
            profile: Student profile dict with keys:
                - skills: list[str]
                - bio: str
                - education: str
                - experience: str
            jobs: List of job dicts with keys:
                - id: str
                - title: str
                - description: str
                - skills_required: list[str]
                - experience_level: str
                - job_type: str
                - company_name: str
                - location: str
                
        Returns:
            List of match result dicts, sorted by match score (highest first)
        """
        if not jobs:
            return []

        profile_text = self._build_profile_text(profile)
        job_texts = [self._build_job_text(j) for j in jobs]

        # 1. TF-IDF similarity
        tfidf_scores = self.tfidf.compute_similarity(profile_text, job_texts)

        # 2. SBERT semantic similarity
        sbert_scores = self.sbert.compute_similarity(profile_text, job_texts)

        # 3. Build features & run Random Forest for each job
        results = []
        student_skills = profile.get("skills") or []

        for i, job in enumerate(jobs):
            job_skills = job.get("skills_required") or []

            features = {
                "skills_overlap": self._compute_skills_overlap(student_skills, job_skills),
                "tfidf_score": tfidf_scores[i],
                "sbert_score": sbert_scores[i],
                "experience_match": self._experience_match(profile, job),
                "job_type_match": self._job_type_match(profile, job),
            }

            rf_result = self.rf.predict_match(features)

            results.append({
                "job_id": job.get("id"),
                "job_title": job.get("title"),
                "company_name": job.get("company_name"),
                "location": job.get("location"),
                "match_score": round(rf_result["match_probability"] * 100, 1),
                "is_good_match": rf_result["is_good_match"],
                "breakdown": {
                    "skills_overlap": round(features["skills_overlap"] * 100, 1),
                    "skills_coverage": round(self._compute_skills_coverage(student_skills, job_skills) * 100, 1),
                    "tfidf_similarity": round(features["tfidf_score"] * 100, 1),
                    "sbert_similarity": round(features["sbert_score"] * 100, 1),
                    "experience_fit": round(features["experience_match"] * 100, 1),
                    "job_type_fit": round(features["job_type_match"] * 100, 1),
                },
                "matching_skills": self._get_matching_skills(student_skills, job_skills),
                "missing_skills": self._get_missing_skills(student_skills, job_skills),
                "feature_contributions": rf_result["feature_contributions"],
            })

        # Sort by match score descending
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

    def match_single(self, profile: dict, job: dict) -> dict:
        """Match a single student-job pair with detailed breakdown."""
        results = self.match_profile_to_jobs(profile, [job])
        return results[0] if results else {}
