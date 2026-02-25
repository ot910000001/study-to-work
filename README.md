# TechConnect — Study-to-Work Platform

A full-stack job placement platform connecting technical education students with employers, featuring an **AI-powered job matching engine** built with TF-IDF, Sentence-BERT (SBERT), and Random Forest.

---

## 🚀 Project Overview

TechConnect bridges the gap between students finishing their technical education and employers looking for skilled candidates. Students can browse jobs, apply, and get **AI-matched** to roles that suit their skills and experience. Employers can post jobs, manage listings, and review applicants.

---

## 🗂️ Project Execution Phases

| Phase | Activities | Status |
|-------|-----------|--------|
| Phase 1 | Literature survey, system needs, user flows | ✅ Complete |
| Phase 2 | Architecture, DB schema, workflow diagrams | ✅ Complete |
| Phase 3 | Frontend + Backend base + Database setup | ✅ Complete |
| Phase 4 | TF-IDF, SBERT, Random Forest ML microservice | ✅ Complete |
| Phase 5 | API testing, Selenium UI testing, Cloud Analyst | 🔄 Upcoming |
| Phase 6 | Packaging, documentation, demo setup | 🔄 Upcoming |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** component library
- **Supabase JS** client for auth & database
- **TanStack React Query** for data fetching
- **React Router v6** for routing

### Backend / Database
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- Tables: `profiles`, `jobs`, `applications`, `user_roles`, `institutions`, `notifications`

### ML Microservice (Phase 4)
- **Python 3.12** + **FastAPI** + **Uvicorn**
- **TF-IDF** (scikit-learn) — text similarity between profiles and job descriptions
- **Sentence-BERT** (`all-MiniLM-L6-v2`) — deep semantic similarity via transformer embeddings
- **Random Forest** (scikit-learn) — ensemble classifier combining all signals into a final match score

---

## ⚙️ Getting Started

### Prerequisites
- Node.js ≥ 18 and npm
- Python 3.10+

### 1. Clone the repository

```sh
git clone https://github.com/ot910000001/study-to-work.git
cd study-to-work
```

### 2. Install frontend dependencies

```sh
npm install
```

### 3. Start the frontend dev server

```sh
npm run dev
# Runs at http://localhost:8080
```

### 4. Set up the ML microservice

```sh
cd ml-service
python -m venv venv

# Windows
venv\Scripts\pip install -r requirements.txt

# macOS/Linux
venv/bin/pip install -r requirements.txt
```

### 5. Start the ML microservice

```sh
# Windows
venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000

# macOS/Linux
venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Runs at http://localhost:8000
```

> **Note:** The frontend has a full client-side fallback matching engine, so it works even when the ML service is offline.

---

## 🤖 AI Matching Pipeline

The ML microservice (`ml-service/`) implements a 3-stage matching pipeline:

```
Student Profile + Job Listings
         │
         ▼
┌─────────────────────┐
│  Stage 1: TF-IDF    │  ← Vectorise profile & job text, compute cosine similarity
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Stage 2: SBERT     │  ← Encode with sentence-transformers, dot-product similarity
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Stage 3: Random    │  ← Combine skills overlap + TF-IDF + SBERT + experience fit
│  Forest Classifier  │    → Final match probability (0–100%)
└─────────────────────┘
         │
         ▼
   Ranked match results with skill gap analysis
```

### ML API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/match` | Match a student profile against multiple jobs |
| `POST` | `/api/match-single` | Detailed match for a single student-job pair |
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/model-info` | Model details and feature importances |

---

## 📁 Project Structure

```
study-to-work/
├── src/
│   ├── pages/
│   │   ├── JobMatching.tsx       # AI matching UI (Phase 4)
│   │   ├── Jobs.tsx              # Browse jobs
│   │   ├── JobDetails.tsx        # Job detail + apply
│   │   ├── Dashboard.tsx         # Role-based dashboard
│   │   ├── Profile.tsx           # Student/employer profiles
│   │   ├── Applications.tsx      # Student applications
│   │   ├── PostJob.tsx           # Employer job posting
│   │   └── ...
│   ├── components/
│   │   ├── layout/DashboardLayout.tsx
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/
│   │   └── useAuth.tsx           # Auth context
│   ├── integrations/supabase/    # Supabase client + types
│   └── lib/
│       ├── matching-api.ts       # ML microservice client
│       └── utils.ts
├── ml-service/                   # Python ML microservice
│   ├── main.py                   # FastAPI app
│   ├── requirements.txt
│   └── matching/
│       ├── engine.py             # Orchestrator
│       ├── tfidf_matcher.py      # TF-IDF similarity
│       ├── sbert_matcher.py      # SBERT semantic similarity
│       └── rf_classifier.py      # Random Forest classifier
└── supabase/
    ├── config.toml
    └── migrations/
```

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Student** | Browse & search jobs, apply, AI job matching, manage profile |
| **Employer** | Post jobs, manage listings, review & update applicant status |
| **Admin** | (Reserved for future phases) |

---

## 📄 License

This project is developed as part of an academic capstone. All rights reserved.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
