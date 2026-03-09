# 🚀 SuperBrain Backend (NestJS)

The SuperBrain backend is a high-performance, modular API built with **NestJS**. It handles content extraction, vector embeddings, semantic search, and RAG-based AI interactions.

## 🏗 Architecture

The backend is divided into several core modules:

- **AuthModule**: Handles JWT-based authentication and user registration.
- **ContentModule**: Manages the storage and retrieval of links, notes, and files.
- **AiModule**: Integrates with Google Gemini and handles semantic search logic.
- **VectorModule**: Interface for Qdrant vector database operations.
- **QueueModule**: Manages background jobs for heavy extraction tasks using BullMQ.
- **ShareModule**: Handles public access to curated "brains".

---

## 🚦 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/signup` | Register a new user |
| POST | `/api/v1/signin` | Login and receive JWT token |

### 📝 Content Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/content` | ✅ | Add new link or note |
| POST | `/api/v1/content/upload` | ✅ | Upload PDF or Image |
| GET | `/api/v1/content` | ✅ | List all user content |
| DELETE | `/api/v1/content/:id` | ✅ | Remove specific content |

### 🧠 AI & Search
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/ai/search?q=...` | ✅ | Semantic search over content |
| POST | `/api/v1/ai/ask` | ✅ | RAG-based Q&A with Gemini |

### 🔗 Sharing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/brain/share` | ✅ | Toggle public sharing (returns hash) |
| GET | `/api/v1/brain/:hash` | ❌ | Get publicly shared content |

---

## 🛠 Tech Stack Details

- **Language**: TypeScript
- **Framework**: NestJS
- **Database**: MongoDB (via Mongoose)
- **Vector DB**: Qdrant
- **Queue**: BullMQ (Redis)
- **AI**: Google Generative AI (Gemini), Xenova Transformers (Local Embeddings)

---

## 🔧 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your credentials.

3. **Run in Development**:
   ```bash
   npm run start:dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   npm run start:prod
   ```

---

## 👷‍♂️ Background Processing

The backend uses **BullMQ** to ensure that heavy tasks like PDF parsing and OCR don't block the main API thread. Ensure you have a running **Redis** instance configured in your `.env`.

Worker roles:
- `ExtractionProcessor`: Fetches links, parses PDFs, and performs OCR.
- `EmbeddingGenerator`: Generates vectors and upserts to Qdrant.
