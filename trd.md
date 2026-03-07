Perfect — now we move from **product thinking (PRD)** to **engineering thinking (TRD)**.

Since you want:

* ✅ No paid services
* ✅ Free AI models
* ✅ Better backend stack (NestJS instead of Express)
* ✅ Production-grade architecture
* ✅ Scalable design

I’ll design this like a real startup technical document.

---

# 📘 Technical Requirements Document (TRD)

# 🧠 Project: SecondBrain

AI-powered personal knowledge vault with semantic retrieval.

---

# 1️⃣ High-Level Architecture

## 🏗 System Overview

```
Frontend (Next.js)
        ↓
Backend API (NestJS)
        ↓
MongoDB (Metadata + Raw Content)
        ↓
Vector Database (Qdrant - self-hosted)
        ↓
AI Layer
  - Embedding Model (local via transformers.js)
  - Gemini Free (answer generation only)
        ↓
Extraction Services
  - Cheerio (HTML parsing)
  - PDF-parse
  - Tesseract OCR
```

---

# 2️⃣ Technology Stack (100% Free)

## Frontend

* Next.js 14 (App Router)
* TailwindCSS
* React Query
* Zustand (lightweight state)

## Backend

* NestJS (TypeScript)
* MongoDB (Atlas free tier)
* Qdrant (Docker, free)
* BullMQ (background jobs)
* Redis (local or free Upstash)
* Zod or class-validator

## AI & ML

* Embeddings: `@xenova/transformers` (local CPU)
* Answer generation: Gemini free tier
* OCR: Tesseract
* PDF parsing: pdf-parse

## Deployment (Free)

* Backend: Railway / Render
* Frontend: Vercel
* DB: MongoDB Atlas free tier
* Vector DB: Self-hosted Qdrant on Railway

---

# 3️⃣ Core System Modules

---

# 3.1 Authentication Module

### Features:

* JWT authentication
* Password hashing (bcrypt)
* Role-based access (future-proof)

### Tech:

* Passport JWT
* Guards in NestJS

---

# 3.2 Content Ingestion Module

### Content Types:

* Links
* Notes
* PDFs
* Images

### Flow:

```
User uploads content
        ↓
Content saved in Mongo (status = "processing")
        ↓
Job added to Queue
        ↓
Extraction worker runs
```

---

# 3.3 Extraction Service

## Link Extraction

* Fetch HTML
* Parse with Cheerio
* Extract:

  * Title
  * Main text
  * Metadata

## YouTube

* Use youtube-transcript library
* Extract transcript

## PDF

* pdf-parse

## Image

* Tesseract OCR

---

# 3.4 Text Processing Pipeline

### 1. Cleaning

* Remove scripts
* Normalize whitespace

### 2. Chunking

Split into:

* 500–800 tokens
* Overlap: 100 tokens

---

# 3.5 Embedding Service (FREE)

### Use:

`@xenova/transformers`

Example model:

* `Xenova/all-MiniLM-L6-v2`
* Dimension: 384
* Fast on CPU

Example:

```ts
const extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2"
);

const embeddings = await extractor(text);
```

### Why local?

* No API cost
* No rate limits
* Full control
* Works offline

---

# 3.6 Vector Database

## Use: Qdrant (Self-hosted)

Why not Pinecone?

* Pinecone free tier limited
* Paid after scale

Why Qdrant?

* Open-source
* Free forever
* Docker-based
* High performance
* Supports filtering by userId

### Collection config:

* Dimension: 384
* Distance: Cosine

---

# 3.7 Query Engine (RAG)

When user asks:

```
"Where did I read about vector DB?"
```

Flow:

1. Generate embedding for query
2. Search Qdrant with filter userId
3. Retrieve top-k chunks
4. Send chunks to Gemini
5. Return grounded answer

---

# 4️⃣ AI Answer Generation

Use Gemini free tier for:

* Summarization
* Question answering
* Tag generation

Prompt pattern:

```
You are a personal knowledge assistant.
Answer using ONLY the provided context.

Context:
{retrieved_chunks}

Question:
{user_query}
```

Return:

* Answer
* Source titles
* Confidence score

---

# 5️⃣ Data Model Design

---

## User Schema

```ts
{
  _id,
  email,
  username,
  password,
  createdAt
}
```

---

## Content Schema

```ts
{
  _id,
  userId,
  type,
  originalLink,
  extractedText,
  summary,
  tags,
  status,
  createdAt
}
```

---

## Vector Payload (Qdrant)

```json
{
  id: chunkId,
  vector: [384 floats],
  payload: {
    userId,
    contentId,
    text,
    title
  }
}
```

---

# 6️⃣ Background Job System

Use BullMQ for:

* Link extraction
* PDF processing
* OCR
* Embedding generation
* Auto-tagging

This prevents blocking HTTP requests.

---

# 7️⃣ API Endpoints (NestJS)

### Auth

* POST /auth/signup
* POST /auth/login

### Content

* POST /content
* GET /content
* DELETE /content/:id

### AI

* GET /search?q=
* POST /ask

### Share

* POST /share
* GET /brain/:hash

---

# 8️⃣ Security Considerations

* JWT validation
* Vector filtering by userId
* Rate limiting
* File size limits
* Input sanitization
* Content type validation

---

# 9️⃣ Performance Strategy

* Chunk caching
* Background embedding
* Pagination
* Redis cache for frequent queries

---

# 🔟 Scalability Strategy

When scale increases:

* Move embedding service to worker container
* Add GPU node for faster embeddings
* Add sharded Mongo
* Use Qdrant clustering

---

# 11️⃣ Non-Functional Requirements

| Requirement       | Target     |
| ----------------- | ---------- |
| Query response    | < 2s       |
| Content ingestion | < 5s       |
| Uptime            | 99%        |
| Cost              | $0 initial |

---

# 12️⃣ Future Enhancements

* Browser extension
* Mobile app
* Graph visualization
* Knowledge clustering
* Smart reminders
* Email ingestion

---

# 13️⃣ DevOps Plan

Use Docker:

* NestJS container
* Qdrant container
* Redis container

Compose file example:

```
docker-compose.yml
```

Services:

* api
* qdrant
* redis
* mongo

---

# 14️⃣ Why This Stack is Better Than Express + Pinecone

| Feature          | Express + Pinecone | Nest + Qdrant |
| ---------------- | ------------------ | ------------- |
| Cost             | Eventually paid    | Fully free    |
| Scalability      | Limited free tier  | Self-host     |
| Structure        | Manual             | Modular       |
| Jobs             | Manual             | BullMQ        |
| Production ready | Moderate           | High          |

---

# 15️⃣ System Strength

SecondBrain becomes:

* A true RAG system
* Fully free AI stack
* No vendor lock-in
* Fully controllable
* Production scalable
* AI-native knowledge engine

---

# 🚀 Final Architecture Decision

Best free stack for you:

* NestJS backend
* Qdrant vector DB
* MongoDB Atlas free
* Local embeddings
* Gemini free for answers
* BullMQ background workers

