# 🧠 SuperBrain

An AI-powered personal knowledge vault. Save links, PDFs, images, and notes — the system extracts text, generates embeddings, stores them in a vector database, and lets you ask natural-language questions over your data using RAG (Retrieval-Augmented Generation).

---

## Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Framer Motion |
| **Backend** | NestJS 11 (TypeScript) |
| **Database** | MongoDB (users & content metadata) |
| **Vector DB** | Qdrant (semantic search embeddings) |
| **Queue** | BullMQ + Redis (async content processing) |
| **Embeddings** | Hugging Face `all-MiniLM-L6-v2` (local, 384d, no API cost) |
| **LLM** | Google Gemini (summarization + RAG Q&A) |

---

## Features

- **Save anything** — links, PDFs, images, manual notes
- **Auto-extraction** — web scraping (Cheerio), PDF parsing, YouTube transcripts
- **Semantic search** — search by meaning using vector similarity
- **RAG Q&A** — ask your brain questions, get answers grounded in your data
- **Share your brain** — toggle public access with a unique hash link
- **Privacy** — all embeddings isolated per user; private by default

---

## Quick Start (Local)

### 1. Configure the backend

```bash
cp super-brain-be/.env.example super-brain-be/.env
```

Set `GEMINI_API_KEY` in `super-brain-be/.env`. The example config uses Redis at `127.0.0.1:6380` when the backend runs directly on your computer.

### 2. Start infrastructure

```bash
docker compose up -d mongodb qdrant redis
```

Compose publishes the Redis container on host port `6380` because host port `6379` may already be used by a local Redis service. Inside Docker, Redis remains available as `redis:6379`.

### 3. Run the backend

```bash
cd super-brain-be
npm ci
npm run start:dev
```

### 4. Run the frontend

```bash
cd super-brain-fe
npm ci
npm run dev
```

Frontend: http://localhost:3001  
Backend API: http://localhost:3000/api/v1  
Health check: http://localhost:3000/api/v1/health/ready

---

## Full Stack with Docker

```bash
# Copy and configure the backend environment once
cp super-brain-be/.env.example super-brain-be/.env
# Set GEMINI_API_KEY, a random JWT_SECRET (at least 32 characters),
# and ALLOWED_ORIGINS=http://localhost:4000 in super-brain-be/.env

# Build and start the complete stack
docker compose up -d --build

# Frontend: http://localhost:4000
# Backend:  http://localhost:3000
```

In the full Docker stack, the backend connects to Redis using the Compose service name `redis` on port `6379`. Do not set its container host to `127.0.0.1`; that would point back to the backend container itself.

---

## Environment Variables

### Backend (`super-brain-be/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (LLM) |
| `MONGO_URL` | ✅ | MongoDB connection string |
| `QDRANT_URL` | ✅ | Qdrant URL (`http://127.0.0.1:6333` local) |
| `QDRANT_API_KEY` | Cloud only | Qdrant Cloud API key |
| `REDIS_URL` | No | Redis URL; alternatively use `REDIS_HOST` and `REDIS_PORT` (local Compose Redis is `127.0.0.1:6380` for a host-run backend) |
| `JWT_SECRET` | ✅ | JWT signing secret (use a long random string) |
| `ALLOWED_ORIGINS` | Prod only | Comma-separated CORS allowed origins |
| `PORT` | No | Server port (default: `3000`) |

### Frontend (`super-brain-fe/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Docker only | Backend origin used by the frontend's same-origin API proxy (Compose sets `http://backend:3000`) |

---

## Architecture

```
User → Next.js Frontend
         ↓ Axios + JWT Bearer
       NestJS Backend (port 3000)
         ├── Auth (signup/signin → JWT)
         ├── Content (CRUD + file upload)
         │     └── BullMQ queue → ExtractionProcessor
         │           ├── Cheerio (web) / pdf-parse / YouTube Transcript
         │           ├── Gemini (summarization)
         │           ├── HuggingFace MiniLM (embeddings, local)
         │           └── Qdrant (vector upsert)
         ├── AI (semantic search + RAG Q&A)
         └── Share (public brain links)
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | — | Health check |
| `POST` | `/api/v1/signup` | — | Register user |
| `POST` | `/api/v1/signin` | — | Login, get JWT |
| `GET` | `/api/v1/content` | JWT | List user's content |
| `POST` | `/api/v1/content` | JWT | Add link/note |
| `POST` | `/api/v1/content/upload` | JWT | Upload file (PDF/image) |
| `DELETE` | `/api/v1/content/:id` | JWT | Delete content + vectors |
| `GET` | `/api/v1/ai/search?q=...` | JWT | Semantic vector search |
| `POST` | `/api/v1/ai/ask` | JWT | RAG Q&A with chat history |
| `POST` | `/api/v1/ai/reindex` | JWT | Re-embed all content |
| `POST` | `/api/v1/brain/share` | JWT | Toggle public sharing |
| `GET` | `/api/v1/brain/:hash` | — | View shared brain |
