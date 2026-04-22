/**
 * ML Matching API Client
 * Connects the React frontend to the Python ML microservice.
 */

const ML_API_URL = "http://localhost:8000";

export interface StudentProfile {
  skills: string[];
  bio: string;
  education: string;
  experience: string;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  skills_required: string[];
  experience_level: string;
  job_type: string;
  company_name: string;
  location: string;
}

export interface MatchBreakdown {
  skills_overlap: number;
  skills_coverage: number;
  tfidf_similarity: number;
  sbert_similarity: number;
  experience_fit: number;
  job_type_fit: number;
}

export interface MatchResult {
  job_id: string;
  job_title: string;
  company_name: string;
  location: string;
  match_score: number;
  is_good_match: boolean;
  breakdown: MatchBreakdown;
  matching_skills: string[];
  missing_skills: string[];
  feature_contributions: Record<string, number>;
}

export interface MatchResponse {
  matches: MatchResult[];
  total_jobs: number;
  good_matches: number;
  model_info: {
    tfidf: string;
    sbert: string;
    random_forest: string;
  };
}

export interface ModelInfo {
  models: {
    tfidf: {
      type: string;
      description: string;
      max_features: number;
      ngram_range: number[];
    };
    sbert: {
      type: string;
      description: string;
      model_name: string;
      available: boolean;
    };
    random_forest: {
      type: string;
      description: string;
      n_estimators: number;
      features: string[];
      feature_importances: Record<string, number>;
      trained: boolean;
    };
  };
}

export async function matchJobs(
  profile: StudentProfile,
  jobs: JobListing[]
): Promise<MatchResponse> {
  const response = await fetch(`${ML_API_URL}/api/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, jobs }),
  });

  if (!response.ok) {
    throw new Error(`ML service error: ${response.statusText}`);
  }

  return response.json();
}

export async function matchSingleJob(
  profile: StudentProfile,
  job: JobListing
): Promise<{ match: MatchResult; model_info: MatchResponse["model_info"] }> {
  const response = await fetch(`${ML_API_URL}/api/match-single`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, job }),
  });

  if (!response.ok) {
    throw new Error(`ML service error: ${response.statusText}`);
  }

  return response.json();
}

export async function getMLHealth(): Promise<{
  status: string;
  engine_ready: boolean;
  sbert_available: boolean;
}> {
  const response = await fetch(`${ML_API_URL}/api/health`);
  if (!response.ok) throw new Error("ML service unavailable");
  return response.json();
}

export async function getModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${ML_API_URL}/api/model-info`);
  if (!response.ok) throw new Error("ML service unavailable");
  return response.json();
}

export async function parseResume(file: File): Promise<{ text: string; skills: string[] }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${ML_API_URL}/api/parse-resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ML service error: ${response.statusText}`);
  }

  return response.json();
}
