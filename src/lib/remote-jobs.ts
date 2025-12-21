// Public jobs fetcher using Remotive (no API key required).
// Docs: https://remotive.com/api/remote-jobs
// This API is CORS-friendly for frontend use.

export interface RemoteJob {
  id: number;
  company_name: string;
  title: string;
  location: string;
  job_type: string;
  url: string;
  created_at: string;
  description: string;
  tags: string[];
}

interface RemotiveResponse {
  jobs?: Array<{
    id?: number;
    company_name?: string;
    title?: string;
    candidate_required_location?: string;
    job_type?: string;
    url?: string;
    publication_date?: string;
    description?: string;
    tags?: string[];
  }>;
}

export async function fetchRemoteJobs(search?: string): Promise<RemoteJob[]> {
  const params = new URLSearchParams();
  params.set("limit", "20");
  if (search) params.set("search", search);

  const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Remote jobs request failed: ${res.status}`);
  }

  const json = (await res.json()) as RemotiveResponse;
  const items = json.jobs || [];

  return items
    .filter((item) => item.id && item.title && item.company_name && item.url)
    .map((item) => ({
      id: item.id!,
      company_name: item.company_name || "",
      title: item.title || "",
      location: item.candidate_required_location || "Remote",
      job_type: item.job_type || "Remote",
      url: item.url || "",
      created_at: item.publication_date || new Date().toISOString(),
      description: item.description || "",
      tags: item.tags || [],
    }));
}