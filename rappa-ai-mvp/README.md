# Rappa.AI - Intelligent Document Processing Platform

An enterprise-grade document processing platform specializing in Indian Sales Deeds (Kannada/English). Built for high-accuracy OCR, fraud detection, and automated data extraction using Large Language Models (LLMs).

## 🚀 Key Features

*   **Smart Document Classification**: Automatically routes PDFs (Text-only vs Scanned) to the optimal processing pipeline.
*   **Hybrid OCR Engine**: Combines **Tesseract (LSTM)** for heavy text and **Gemini Vision (Multimodal)** for complex layouts.
*   **Dual-Language Support**: Optimized for mixed English and Kannada documents.
*   **Fraud Detection**: Analyzes document metadata and content anomalies.
*   **Human-in-the-Loop**: Comprehensive UI for validating and editing extracted fields.
*   **Custom Fields**: Define and track custom data points per job.

## 🏗️ Technology Stack

*   **Frontend**: React 18, Tailwind CSS, Vite (Dockerized with Nginx)
*   **Backend**: FastAPI, Python 3.11, Pydantic 2.0
*   **Database**: PostgreSQL 15 (Managed via Alembic Migrations)
*   **Queue/Cache**: Redis 7, Celery Distributed Task Queue
*   **AI/ML**:
    *   **LLM Service**: Google Gemini Pro / Vision
    *   **OCR**: Tesseract + Poppler (via PyMuPDF)
    *   **Classification**: PyMuPDF Analysis

## 📂 Project Structure

```
rappa-ai-mvp/
├── backend/                # FastAPI Application
│   ├── alembic/            # Database Migrations
│   ├── app/
│   │   ├── api/            # API Route Handlers
│   │   ├── core/           # Config, Database, Security
│   │   ├── models/         # SQLAlchemy ORM Models
│   │   ├── services/       # Business Logic (OCR, LLM, Storage)
│   │   └── workers/        # Celery Tasks
│   ├── tests/              # Pytest Suite
│   └── Dockerfile          # Backend Container Config
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Application Pages
│   │   └── services/       # API Clients
│   └── Dockerfile          # Frontend Container Config
│
└── docker-compose.yml      # Production Orchestration
```

## 🛠️ Deployment (Production)

The project is fully containerized using Docker.

1.  **Prerequisites**: Install Docker & Docker Compose.
2.  **Environment Setup**:
    Copy `backend/.env.example` to the root directory as `.env` and fill in secrets (AWS/Backblaze keys, Gemini API Key, DB passwords).
3.  **Run**:
    ```bash
    docker-compose up --build -d
    ```
    *   Frontend: `http://localhost` (Port 80)
    *   Backend API: `http://localhost:8000`

## 💻 Development (Local)

To run locally without Docker:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m app.main
# (Make sure Redis and Postgres are running locally)
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🗄️ Database Migrations

We use **Alembic** for database version control.

*   **Create Migration**: `alembic revision --autogenerate -m "description"`
*   **Apply Migration**: `alembic upgrade head`
