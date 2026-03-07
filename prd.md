Perfect. This is exactly the right time to write a **real PRD** before building more features.

You’re building something serious now — not just CRUD + embeddings — but a **personal knowledge engine**.

I’ll structure this like a proper startup-level PRD.

---

# 📘 Product Requirements Document (PRD)

# 🧠 Product Name: SecondBrain

---

# 1. 🎯 Product Vision

SecondBrain is a personal AI-powered knowledge vault where users can:

* Dump links (YouTube, Twitter, blogs, docs)
* Upload images & files
* Store notes
* Share curated knowledge publicly
* Ask questions over their data
* Get AI-powered semantic answers

The goal is:

> “Your searchable, intelligent memory layer for everything you consume online.”

---

# 2. 👤 Target Users

### Primary Users

* Students
* Developers
* Researchers
* Content creators
* Startup founders
* Knowledge workers

### Secondary Users

* Teams sharing knowledge
* Creators sharing curated brains publicly

---

# 3. 🚀 Core Features (MVP)

---

## 3.1 User Management

* Sign up / Sign in
* JWT authentication
* User profile
* Data isolation per user

---

## 3.2 Content Ingestion (Dump Everything)

User can add:

### ✅ Links

* YouTube
* Twitter/X
* Blogs
* Articles
* GitHub repos
* Notion pages

### ✅ Files

* PDF
* DOCX
* TXT
* Markdown

### ✅ Images

* PNG
* JPG
* WebP

### ✅ Manual Notes

* Rich text
* Markdown supported

---

## 3.3 Data Extraction Service (Core Intelligence Layer)

This is the heart of the system.

When user adds content:

### For Links:

* Fetch HTML
* Extract readable content (title, body)
* Extract metadata
* Extract OpenGraph image
* For YouTube → extract transcript
* For Twitter → extract thread text

### For PDFs:

* Extract text using PDF parser

### For Images:

* Extract text using OCR (Tesseract)
* Optionally describe image using Gemini free model

---

# 4. 🧠 AI Processing Layer

After extraction:

### 4.1 Text Cleaning

* Remove boilerplate
* Normalize whitespace
* Remove ads

### 4.2 Chunking

* Split into 500–1000 token chunks

### 4.3 Embedding Generation (Free models)

Recommended:

| Model                   | Cost                        | Use           |
| ----------------------- | --------------------------- | ------------- |
| Pinecone integrated     | Free tier                   | Best option   |
| Gemini embedding        | Free tier (quota dependent) | Optional      |
| Xenova local embedding  | Free                        | Fully offline |
| HuggingFace local model | Free                        | CPU-based     |

---

# 5. 🗄 Storage Architecture

### MongoDB (Metadata Layer)

Stores:

* Original link
* Extracted text
* User ID
* File metadata
* Share state
* Tags
* Summary
* Timestamps

### Pinecone (Vector Layer)

Stores:

* Vector embeddings
* Metadata (userId, contentId, text)

---

# 6. 🔎 AI Query Engine (Main Feature)

When user asks:

> “Where did I read about vector databases?”
> “What was that Elon Musk rocket video?”
> “Summarize my AI notes.”

Flow:

1. Convert query → embedding
2. Vector similarity search (Pinecone)
3. Retrieve top-k chunks
4. Send to Gemini free model for answer synthesis
5. Return:

   * Direct answer
   * Sources used
   * Confidence score

---

# 7. 🧠 Smart Features

## 7.1 Semantic Search

Natural language search.

## 7.2 Ask Your Brain (RAG system)

AI answers grounded in user data only.

## 7.3 Auto Tagging

Gemini generates tags per content.

## 7.4 Auto Summarization

Generate short and long summaries.

## 7.5 Related Content

Show similar saved items.

## 7.6 Knowledge Graph (Future)

Visualize connections between topics.

---

# 8. 🔗 Share Brain Feature

User can:

* Generate public brain link
* Share selected items only
* Toggle public/private mode
* Share via:

  * Hash link
  * QR code

Public users can:

* Browse
* Search
* Ask questions (read-only)

---

# 9. 🏗 Architecture Overview

```
Frontend: Next.js
Backend: Express + TypeScript
Database: MongoDB
Vector DB: Pinecone
AI Models: Gemini (free tier)
Extraction: Cheerio + PDF parser + OCR
```

---

# 10. 📊 Data Flow

## Adding Content

User → API →
Extract service →
Clean & chunk →
Generate embeddings →
Store metadata in Mongo →
Store vectors in Pinecone

---

## Querying

User query →
Embed query →
Vector search →
Retrieve chunks →
Send to Gemini →
Return AI answer

---

# 11. 🧱 Technical Modules

### 11.1 Content Extractor Service

* HTML parser
* YouTube transcript extractor
* PDF text extractor
* OCR for images

### 11.2 AI Embedding Service

Abstract service:

```ts
generateEmbedding(text)
```

### 11.3 Vector Search Service

```ts
searchSimilar(query, userId)
```

### 11.4 AI Response Generator

```ts
generateAnswer(contextChunks, query)
```

---

# 12. 🔐 Security Requirements

* JWT authentication
* User-level vector filtering
* Prevent cross-user leakage
* Input validation via Zod
* Rate limiting

---

# 13. 🏎 Performance Requirements

* Query response < 2s
* Add content < 5s
* Chunking async
* Background processing for heavy files

---

# 14. 📈 Future Roadmap

### Phase 2

* Chrome extension
* Browser clipper
* Slack integration
* Notion sync

### Phase 3

* Team workspaces
* Knowledge analytics
* Topic clustering
* Memory timeline

---

# 15. 🎯 Success Metrics

* Daily active users
* Query-to-answer success rate
* Time-to-answer
* Share brain usage
* Content saved per user

---

# 16. 🧠 Unique Differentiator

Unlike Notion, Readwise, or Obsidian:

SecondBrain:

* Is AI-first
* Works automatically
* Answers questions
* Understands semantic meaning
* Is affordable (free AI models)



# 19. Non-Goals (For Now)

* No multi-modal embeddings
* No video storage
* No internal LLM hosting
* No complex fine-tuning

---

# 🧠 Final Product Summary

SecondBrain is:

* A personal AI knowledge vault
* A semantic search engine over your life
* A memory assistant
* A curated knowledge sharer
* A RAG-based AI over your own data


