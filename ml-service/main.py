"""
TechConnect ML Job Matching Microservice
========================================
FastAPI microservice providing AI-powered job matching using:
- TF-IDF (Term Frequency–Inverse Document Frequency) for text similarity
- SBERT (Sentence-BERT) for semantic similarity
- Random Forest classifier for final match scoring

Endpoints:
- POST /api/match       → Match a student profile against multiple jobs
- POST /api/match-single → Detailed match for a single student-job pair
- GET  /api/health       → Health check
- GET  /api/model-info   → Model information and status
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from matching.engine import MatchingEngine
import pypdf
import io
import re

# Predefined list of common hard skills for extraction
KNOWN_SKILLS = [
    "python", "javascript", "typescript", "react", "node.js", "sql", "nosql", "machine learning",
    "ai", "data science", "html", "css", "docker", "kubernetes", "aws", "gcp", "azure", "git",
    "github", "linux", "c++", "java", "c#", "go", "rust", "php", "ruby", "swift", "angular",
    "vue", "svelte", "django", "flask", "fastapi", "spring", "express", "pandas", "numpy",
    "scikit-learn", "tensorflow", "pytorch", "keras", "sql server", "mysql", "postgresql",
    "mongodb", "redis", "firebase", "supabase", "graphql", "rest api", "ci/cd", "agile",
    "scrum", "jira", "figma", "ui/ux", "wireframing", "prototyping", "tailwind", "next.js", 
    "vite", "vercel", "c", "keras", "nlp", "llms"
]


# ── App Setup ──────────────────────────────────────────────

app = FastAPI(
    title="TechConnect ML Matching Service",
    description="AI-powered job matching microservice using TF-IDF, SBERT, and Random Forest",
    version="1.0.0",
)

# CORS - allow frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML engine on startup
engine: MatchingEngine = None


@app.on_event("startup")
async def startup():
    global engine
    engine = MatchingEngine()


# ── Request/Response Models ────────────────────────────────

class StudentProfile(BaseModel):
    skills: list[str] = []
    bio: str = ""
    education: str = ""
    experience: str = ""


class JobListing(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    skills_required: list[str] = []
    experience_level: str = ""
    job_type: str = ""
    company_name: str = ""
    location: str = ""


class MatchRequest(BaseModel):
    profile: StudentProfile
    jobs: list[JobListing]


class SingleMatchRequest(BaseModel):
    profile: StudentProfile
    job: JobListing


# ── Endpoints ──────────────────────────────────────────────

@app.post("/api/match")
async def match_jobs(request: MatchRequest):
    """
    Match a student profile against multiple job listings.
    Returns ranked results with match scores and detailed breakdowns.
    
    Uses a 3-stage ML pipeline:
    1. TF-IDF vectorization for text similarity scoring
    2. SBERT embeddings for semantic similarity scoring
    3. Random Forest to combine all signals into a final match probability
    """
    if engine is None:
        raise HTTPException(status_code=503, detail="ML engine not initialized")

    profile_dict = request.profile.model_dump()
    jobs_dict = [j.model_dump() for j in request.jobs]

    results = engine.match_profile_to_jobs(profile_dict, jobs_dict)

    return {
        "matches": results,
        "total_jobs": len(jobs_dict),
        "good_matches": sum(1 for r in results if r["is_good_match"]),
        "model_info": {
            "tfidf": "active",
            "sbert": "active" if engine.sbert.is_available else "fallback (keyword overlap)",
            "random_forest": "active",
        },
    }


@app.post("/api/match-single")
async def match_single_job(request: SingleMatchRequest):
    """
    Detailed match analysis for a single student-job pair.
    Returns comprehensive breakdown of match signals.
    """
    if engine is None:
        raise HTTPException(status_code=503, detail="ML engine not initialized")

    profile_dict = request.profile.model_dump()
    job_dict = request.job.model_dump()

    result = engine.match_single(profile_dict, job_dict)

    return {
        "match": result,
        "model_info": {
            "tfidf": "active",
            "sbert": "active" if engine.sbert.is_available else "fallback (keyword overlap)",
            "random_forest": "active",
        },
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "engine_ready": engine is not None,
        "sbert_available": engine.sbert.is_available if engine else False,
    }


@app.get("/api/model-info")
async def model_info():
    """Return information about loaded ML models."""
    if engine is None:
        raise HTTPException(status_code=503, detail="ML engine not initialized")

    return {
        "models": {
            "tfidf": {
                "type": "TF-IDF Vectorizer",
                "description": "Term Frequency-Inverse Document Frequency for text similarity",
                "max_features": 5000,
                "ngram_range": [1, 2],
            },
            "sbert": {
                "type": "Sentence-BERT",
                "description": "Deep semantic text similarity using transformer embeddings",
                "model_name": engine.sbert.model_name,
                "available": engine.sbert.is_available,
            },
            "random_forest": {
                "type": "Random Forest Classifier",
                "description": "Ensemble classifier combining all matching signals",
                "n_estimators": 100,
                "features": engine.rf.feature_names,
                "feature_importances": dict(
                    zip(engine.rf.feature_names, engine.rf.model.feature_importances_.round(4).tolist())
                ),
                "trained": engine.rf.is_trained,
            },
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Extracts text from a PDF resume and identifies common skills.
    Returns the extracted text and a list of detected skills.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesBytesIO(content) if not hasattr(io, 'BytesIO') else io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
                
        text_lower = text.lower()
        extracted_skills = set()
        
        for skill in KNOWN_SKILLS:
            # Word boundary search for skills
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                extracted_skills.add(skill)
                
        return {
            "text": text.strip(),
            "skills": list(extracted_skills)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
