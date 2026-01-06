# Rappa.AI - Complete Features Overview

**Last Updated:** December 31, 2025
**Version:** MVP 1.0

---

## 📋 Table of Contents

1. [Core Features](#core-features)
2. [Document Processing](#document-processing)
3. [Custom Templates & Batch Processing](#custom-templates--batch-processing)
4. [User Management](#user-management)
5. [API Endpoints](#api-endpoints)
6. [Frontend Pages](#frontend-pages)
7. [Backend Services](#backend-services)
8. [Database Models](#database-models)

---

## 🎯 Core Features

### 1. **Smart Document Processing**
- **Auto-Classification**: Automatically detects document type (Sales Deed, Bank Statement, etc.)
- **Dual OCR Engine**:
  - Tesseract LSTM for text-heavy documents
  - Gemini Vision for complex layouts and scanned documents
- **Multi-Language Support**: English + Kannada (Indian languages)
- **Field Extraction**: AI-powered extraction using Gemini Pro LLM

### 2. **Custom Templates System** ✨ NEW
- Create custom document templates for recurring document types
- AI-powered schema generation from sample documents
- Drag-and-drop field reordering interface
- JSONB storage for flexible schema definitions
- Template-based processing for consistent results

### 3. **Batch Processing** ✨ NEW
- Upload and process multiple documents (up to 100 files)
- Template-based batch extraction
- CSV/Excel export with pandas
- 30-day auto-expiration for data management
- Progress tracking and status monitoring

### 4. **Fraud Detection**
- Document metadata analysis
- Content anomaly detection
- Duplicate file detection (SHA-256 hashing)
- Risk scoring system
- Confidence-based alerts

### 5. **Human-in-the-Loop Validation**
- Interactive field editing interface
- Confidence score display
- Side-by-side document viewer
- Field history tracking
- Custom field definitions

---

## 📄 Document Processing

### Processing Pipeline

```
Upload → Classification → OCR/Vision → Field Extraction → Fraud Detection → Results
```

### Supported Document Types

**Real Estate:**
- Sales Deeds (Kannada/English)
- Property Registration Documents
- Land Records

**Banking:**
- Bank Statements
- Passbooks
- Transaction Records

**Finance:**
- Financial Statements
- Tax Documents
- Invoice Processing

**Personal:**
- ID Documents
- Certificates
- General Documents

### Processing Methods

1. **Auto-Detect** (AI-Based)
   - Automatic document type detection
   - Best-fit processing method selection
   - Template matching suggestions

2. **Template-Based**
   - Use predefined or custom templates
   - Consistent field extraction
   - Higher accuracy for known formats

### Smart Template Suggestions
- After auto-detect processing, system checks for matching templates
- Purple banner notification if better template exists
- One-click re-processing with matched template
- Seamless workflow integration

---

## 🎨 Custom Templates & Batch Processing

### Custom Template Features

**Template Creation:**
- Upload sample document
- AI generates field schema automatically
- Edit field names and properties
- Drag-and-drop reordering
- Category assignment (Real Estate, Banking, etc.)

**Template Management:**
- View all templates
- Edit existing templates
- Delete unused templates
- Track usage statistics

**Schema Structure (JSONB):**
```json
{
  "fields": [
    {
      "name": "field_name",
      "type": "string|number|date",
      "required": true,
      "order": 1
    }
  ]
}
```

### Batch Processing Features

**Batch Upload:**
- Drag-and-drop multiple files
- File validation (PDF, JPG, PNG)
- Size limits (50MB per file)
- Preview thumbnails

**Processing:**
- Template selection
- Parallel processing with Celery
- Real-time progress tracking
- Error handling per document

**Export:**
- CSV format (basic data)
- Excel format (formatted, with metadata)
- Includes all extracted fields
- Timestamp and batch information

**Data Management:**
- 30-day automatic expiration
- Cleanup scheduled task
- Storage optimization

---

## 👥 User Management

### Authentication
- JWT-based authentication
- Access token (24 hours)
- Refresh token (30 days)
- Password hashing (bcrypt)
- Email verification

### User Features
- Profile management
- Email change with verification
- Password reset flow
- Credit tracking
- Usage history

### Credits System
- Default credits: 10 per new user
- Cost: 1 credit per document
- Credit history tracking
- Low balance notifications

---

## 🔌 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /verify-email` - Email verification
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Reset password
- `POST /change-email` - Email change request
- `POST /verify-email-change` - Confirm email change

### Document Upload (`/api/v1/upload`)
- `POST /` - Upload document for processing
- `GET /templates` - List available templates

### Processing (`/api/v1/processing`)
- `GET /jobs` - List user's jobs
- `GET /jobs/{id}` - Get job details
- `DELETE /jobs/{id}` - Delete job

### Fields (`/api/v1/fields`)
- `GET /jobs/{id}/fields` - Get extracted fields
- `PUT /fields/{id}` - Update field value

### Custom Fields (`/api/v1/custom-fields`)
- `GET /jobs/{id}/custom-fields` - Get custom fields
- `POST /jobs/{id}/custom-fields` - Add custom field
- `PUT /custom-fields/{id}` - Update custom field
- `DELETE /custom-fields/{id}` - Delete custom field

### Custom Templates (`/api/v1/custom-templates`) ✨ NEW
- `GET /` - List all templates
- `GET /{id}` - Get template details
- `POST /` - Create template
- `POST /generate-schema` - AI schema generation
- `PUT /{id}` - Update template
- `DELETE /{id}` - Delete template

### Batches (`/api/v1/batches`) ✨ NEW
- `GET /` - List all batches
- `GET /{id}` - Get batch details
- `POST /` - Create batch
- `POST /upload` - Upload batch files
- `POST /{id}/process` - Process batch
- `GET /{id}/export/{format}` - Export results (csv/excel)
- `DELETE /{id}` - Delete batch

### Export (`/api/v1/export`)
- `GET /jobs/{id}/csv` - Export job as CSV
- `GET /jobs/{id}/json` - Export job as JSON
- `GET /jobs/{id}/pdf` - Export job as PDF

### Support (`/api/v1/tickets`)
- `POST /` - Create support ticket
- `GET /` - List user's tickets
- `GET /{id}` - Get ticket details

### Contact (`/api/v1/contact`)
- `POST /` - Send contact form

### Dashboard (`/api/v1/dashboard`)
- `GET /stats` - User statistics
- `GET /recent-jobs` - Recent jobs

---

## 🖥️ Frontend Pages

### Public Pages
- **Landing** - Marketing homepage
- **Features** - Feature showcase
- **Solutions** - Use case solutions
- **UseCases** - Industry-specific examples
- **Contact** - Contact form
- **Login/Signup** - Authentication
- **ForgotPassword** - Password recovery
- **ResetPassword** - Password reset
- **VerifyEmailChange** - Email verification

### User Dashboard
- **Dashboard** - Overview and statistics
- **Upload** - Document upload with 2-step category selection
- **Processing** - Processing status
- **JobResults** - View extraction results with template suggestions
- **Documents** - Document library
- **Editor** - Field editing interface

### Templates & Batches ✨ NEW
- **CustomTemplates** - Template management
- **CreateCustomTemplate** - Template creation wizard
- **Batches** - Batch management
- **CreateBatch** - Batch upload and processing

### Account Management
- **Profile** - User profile
- **Settings** - Account settings
- **Credits** - Credit management
- **Support** - Support tickets
- **Help** - Documentation

### Demo & Templates
- **Demo** - Live demo
- **Templates** - Predefined templates gallery

---

## ⚙️ Backend Services

### Document Processing
1. **document_processor** - Main processing orchestrator
2. **pdf_classifier** - PDF type classification (text vs scanned)
3. **ocr_service** - Tesseract OCR engine
4. **simple_ocr_service** - Lightweight OCR
5. **gemini_service** - Gemini API integration
6. **extraction_service** - Field extraction logic

### AI & ML
7. **schema_generation_service** - AI schema generation for templates
8. **fraud_detection** - Fraud analysis engine

### Infrastructure
9. **storage_service** - S3/Backblaze B2 integration
10. **email_service** - SMTP email sending
11. **cache_service** - Redis caching
12. **credit_service** - Credit management
13. **export_service** - CSV/JSON/PDF export
14. **template_service** - Template management

---

## 🗄️ Database Models

### User (`users`)
- `id`, `email`, `password_hash`
- `is_verified`, `is_active`
- `credits_balance`
- `pending_email`, `email_change_token`
- Timestamps: `created_at`, `updated_at`

### Job (`jobs`)
- `id`, `user_id`, `filename`, `s3_path`
- `status` (pending, processing, completed, failed)
- `document_type`
- `file_hash` (SHA-256 for duplicate detection)
- `fraud_analysis` (JSONB)
- `error_message`
- Timestamps: `created_at`, `completed_at`

### ExtractedField (`extracted_fields`)
- `id`, `job_id`
- `field_name`, `original_value`, `current_value`
- `confidence`
- Timestamps: `created_at`, `updated_at`

### CustomField (`custom_fields`)
- `id`, `job_id`, `user_id`
- `field_name`, `field_value`
- Timestamps: `created_at`, `updated_at`

### CustomTemplate (`custom_templates`) ✨ NEW
- `id`, `user_id`
- `name`, `description`, `category`
- `schema` (JSONB - field definitions)
- `is_active`
- Timestamps: `created_at`, `updated_at`

### Batch (`batches`) ✨ NEW
- `id`, `user_id`, `template_id`
- `name`, `description`
- `status` (pending, processing, completed, failed)
- `total_files`, `processed_files`, `failed_files`
- `results` (JSONB - all extraction results)
- `expires_at` (30 days from creation)
- Timestamps: `created_at`, `updated_at`

### CreditLog (`credit_logs`)
- `id`, `user_id`
- `amount`, `balance_after`
- `transaction_type`, `description`
- Timestamps: `created_at`

### Ticket (`tickets`)
- `id`, `user_id`
- `subject`, `message`, `category`
- `status` (open, in_progress, resolved, closed)
- `priority`
- Timestamps: `created_at`, `updated_at`

### Contact (`contacts`)
- `id`, `name`, `email`, `subject`, `message`
- `is_resolved`
- Timestamps: `created_at`

---

## 🚀 Technology Stack

### Frontend
- **React 18** with Hooks
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Navigation
- **@hello-pangea/dnd** - Drag-and-drop (template builder)
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.11** - Runtime
- **Pydantic 2.5** - Data validation
- **SQLAlchemy 2.0** - ORM
- **Alembic** - Database migrations
- **Celery 5.3** - Task queue
- **Redis 5.0** - Cache & message broker

### AI & ML
- **Google Gemini 2.5 Flash Lite** - LLM for extraction
- **Gemini Vision** - Multimodal document analysis
- **Tesseract LSTM** - OCR engine
- **PyMuPDF** - PDF processing
- **ONNX Runtime** - Table detection

### Storage & Database
- **PostgreSQL 15** - Primary database
- **Backblaze B2** - Object storage (S3-compatible)
- **Redis 7** - Cache and Celery broker

### Deployment
- **PM2** - Process management ✨ NEW
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                      Port 5173 (Vite Dev)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│                        Port 8001                             │
├─────────────────────────────────────────────────────────────┤
│  API Routes │ Auth │ Validation │ Business Logic             │
└───┬──────────────────────┬──────────────────────┬───────────┘
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────┐         ┌─────────────┐       ┌──────────────┐
│   Redis │◄────────│   Celery    │       │  PostgreSQL  │
│ (Cache) │         │   Worker    │       │  (Database)  │
└─────────┘         └─────────────┘       └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Gemini API   │
                    │ (AI/Vision)  │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Backblaze B2 │
                    │  (Storage)   │
                    └──────────────┘
```

---

## 🎨 Recent Improvements (Dec 2025)

### UI/UX Enhancements
1. **Two-Step Document Upload**
   - Card-based category selection (Real Estate, Banking, Finance, Personal)
   - Better organization and user experience
   - No dropdown positioning issues

2. **Smart Template Suggestions**
   - Purple gradient banner after auto-detect
   - Automatic template matching
   - One-click re-processing

3. **Drag-and-Drop Template Builder**
   - Visual field reordering
   - Intuitive template creation
   - Real-time preview

### Backend Improvements
1. **Celery Connection Resilience**
   - Auto-retry on connection loss
   - TCP keep-alive
   - Better error handling

2. **Fraud Detection Enhancement**
   - Supports both text and numeric confidence values
   - Flexible parsing
   - Better error handling

3. **Database Optimizations**
   - JSONB for flexible schemas
   - Proper indexing
   - Cascade deletes

### DevOps
1. **PM2 Process Management**
   - Auto-restart on crash
   - Memory monitoring
   - Centralized logging
   - Easy deployment

2. **Dependencies**
   - All packages in requirements.txt
   - Version pinning
   - Proper documentation

---

## 📝 Usage Statistics

### Performance Metrics
- **Average Processing Time**: 15-30 seconds per document
- **OCR Accuracy**: 95%+ for clear documents
- **Field Extraction Accuracy**: 90%+ with LLM
- **Supported Languages**: English, Kannada (more coming)
- **Max File Size**: 50MB per document
- **Batch Size**: Up to 100 files

### Credit Costs
- **Auto-Detect Processing**: 1 credit
- **Template-Based Processing**: 1 credit
- **Batch Processing**: 1 credit per document
- **Re-processing**: 1 credit

---

## 🔐 Security Features

1. **Authentication**
   - JWT tokens with expiration
   - Bcrypt password hashing
   - Email verification required
   - Refresh token rotation

2. **Data Protection**
   - S3 encryption at rest
   - HTTPS in production
   - SQL injection prevention (ORM)
   - XSS protection (React escaping)

3. **Rate Limiting**
   - 100 requests/minute per user
   - 1000 requests/hour per user
   - Celery task limits

4. **Privacy**
   - 30-day batch data expiration
   - User data isolation
   - Secure file deletion

---

## 📚 Documentation

- **Main README**: [README.md](./README.md)
- **Custom Templates Guide**: [CUSTOM_TEMPLATES_README.md](./CUSTOM_TEMPLATES_README.md)
- **API Documentation**: http://localhost:8001/docs (Swagger UI)
- **This Document**: Complete features overview

---

## 🚦 Getting Started

### Using PM2 (Recommended)
```bash
# Start all services
E:\rappa-mvp\pm2-start.bat

# Stop all services
E:\rappa-mvp\pm2-stop.bat

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

### Manual Start
```bash
# Start Redis (WSL)
wsl -e bash -c "redis-server"

# Start Backend
cd E:\rappa-mvp\rappa-ai-mvp\backend
E:\rappa-mvp\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001

# Start Celery
cd E:\rappa-mvp\rappa-ai-mvp\backend
E:\rappa-mvp\.venv\Scripts\python.exe -m celery -A app.workers.tasks worker --loglevel=info --pool=solo

# Start Frontend
cd E:\rappa-mvp\rappa-ai-mvp\frontend
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **API Redoc**: http://localhost:8001/redoc

---

## 🎯 Future Roadmap

### Planned Features
- [ ] Multi-page document support
- [ ] Batch template editing
- [ ] Advanced fraud detection rules
- [ ] Custom webhook notifications
- [ ] API rate limit customization
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

### Under Consideration
- [ ] Additional language support (Hindi, Tamil, Telugu)
- [ ] OCR accuracy improvement
- [ ] Real-time processing updates (WebSockets)
- [ ] Advanced template versioning
- [ ] Integration with external systems
- [ ] White-label solutions

---

**For support or questions, contact the development team or open a support ticket.**
