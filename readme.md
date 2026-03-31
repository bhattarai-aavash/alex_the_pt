# Personal Trainer Agent (Full Stack)

AI fitness coach web app with a Next.js frontend and FastAPI + LangGraph backend, powered by Groq models.

## What This Repo Includes

- Chat agent for workouts, nutrition, recovery, and form coaching
- Food image calorie estimation (multimodal)
- Topic shortcuts in the UI (Workouts, Nutrition, Recovery, Form)
- Production-friendly API proxying from frontend to backend

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind, shadcn/ui
- **Backend:** FastAPI, LangGraph, LangChain
- **LLM Provider:** Groq
- **Model used:** `meta-llama/llama-4-scout-17b-16e-instruct` (text + vision)

## Repository Structure

```txt
personal_trainer_agent/                  # Python backend
  agent/
  server.py
  requirements.txt
  Dockerfile
  .env_example

trainer-frontend/trainer-frontend/       # Next.js frontend app
  src/
    app/
      api/chat/route.ts
      api/food-calories/route.ts
      page.tsx
    components/chat/
    components/ui/
```

## API Endpoints

- `GET /health` - health check
- `POST /chat` - text chat with Alex
- `POST /food/calories` - image-based calorie estimation

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.9+ (3.11 recommended)
- Groq API key

### 1) Backend

```bash
cd personal_trainer_agent

# Optional: create venv if you don't already have one
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
cp .env_example .env
```

Edit `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Run backend:

```bash
uvicorn server:app --reload --port 8000
```

Test:

```bash
curl http://localhost:8000/health
```

### 2) Frontend

```bash
cd trainer-frontend/trainer-frontend
npm install
```

Create `.env.local`:

```env
BACKEND_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Backend (`personal_trainer_agent/.env`)

- `GROQ_API_KEY` (required)
- `FRONTEND_URL` (recommended in production, for CORS)
- `RATE_LIMIT_RPM` (optional, default `60`)
- `MAX_IMAGE_BYTES` (optional, default `5242880`)
- `VISION_TIMEOUT_S` (optional, default `45`)

### Frontend (`trainer-frontend/trainer-frontend/.env.local`)

- `BACKEND_URL` (required in production)



## How Others Can Use This Repo

1. Fork or clone repo.
2. Set `GROQ_API_KEY`.
3. Run backend + frontend locally.
4. Deploy frontend/backend separately (Cloudflare + AWS recommended).

## Groq API Key

Get your key at [Groq Console](https://console.groq.com).