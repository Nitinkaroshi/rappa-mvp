# Rappa.AI - Run Commands Reference

Complete guide for starting and managing all Rappa.AI services.

---

## 🚀 Quick Start (Easiest Method)

### Option 1: Use Batch File (Windows)
Just double-click this file:
```
E:\rappa-mvp\start_all.bat
```

This will automatically start:
- Backend API (port 8001)
- Celery Worker

---

## 📋 Manual Commands

### 1. Start Backend (FastAPI) ✅

**Terminal 1:**
```bash
cd E:/rappa-mvp/rappa-ai-mvp/backend
E:/rappa-mvp/.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**What it does:**
- Starts FastAPI server on `http://localhost:8001`
- `--reload` auto-restarts on code changes
- API docs at `http://localhost:8001/docs`
- Redoc at `http://localhost:8001/redoc`

**Verify it's running:**
```bash
curl http://localhost:8001/health
```
Expected output:
```json
{
  "status": "healthy",
  "service": "Rappa.AI MVP",
  "version": "0.1.0",
  "environment": "development"
}
```

---

### 2. Start Celery Worker ✅

**Terminal 2:**
```bash
cd E:/rappa-mvp/rappa-ai-mvp/backend
E:/rappa-mvp/.venv/Scripts/python.exe -m celery -A app.workers.tasks worker --loglevel=info --pool=solo
```

**Important:** Use `app.workers.tasks` (not `app.worker`)

**What it does:**
- Starts background task processor
- Processes document extraction jobs
- `--pool=solo` is required for Windows
- Logs appear in the terminal

**Verify it's running:**
Look for this output:
```
[tasks]
  . process_document
  . test_task
```

---

### 3. Start Frontend (Optional) 🎨

**Terminal 3:**
```bash
cd E:/rappa-mvp/rappa-ai-mvp/frontend
npm run dev
```

**What it does:**
- Starts Vite dev server on `http://localhost:5173`
- Hot module reload enabled
- Automatically opens browser

---

## 🔍 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React app |
| Backend API | http://localhost:8001 | FastAPI server |
| API Docs (Swagger) | http://localhost:8001/docs | Interactive API docs |
| API Docs (Redoc) | http://localhost:8001/redoc | Alternative docs |
| Health Check | http://localhost:8001/health | Service health |
| DB Health | http://localhost:8001/health/db | Database status |

---

## 🛑 Stop Services

### Stop All Services:
- Press `Ctrl+C` in each terminal window
- Or close the terminal windows

### Stop Specific Service:
- Backend: `Ctrl+C` in Terminal 1
- Celery: `Ctrl+C` in Terminal 2
- Frontend: `Ctrl+C` in Terminal 3

---

## 🐛 Troubleshooting

### Issue: "Unable to load celery application"
**Error:** `The module app.worker was not found`

**Solution:** Use correct module path:
```bash
# ❌ Wrong
celery -A app.worker worker

# ✅ Correct
celery -A app.workers.tasks worker
```

---

### Issue: Port 8001 already in use

**Check what's using the port:**
```bash
netstat -ano | findstr :8001
```

**Kill the process:**
```bash
taskkill /PID <PID_NUMBER> /F
```

---

### Issue: Database connection failed

**Check PostgreSQL is running:**
```bash
# Check if PostgreSQL service is running
sc query postgresql-x64-13
```

**Verify database connection:**
```bash
curl http://localhost:8001/health/db
```

---

### Issue: Celery can't connect to Redis

**Check Redis is running:**
```bash
# If using Redis
redis-cli ping
```

**Check CELERY_BROKER_URL in .env:**
```
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## 📦 Dependencies Check

### Verify Python packages:
```bash
E:/rappa-mvp/.venv/Scripts/python.exe -m pip list
```

**Required packages:**
- fastapi
- uvicorn
- celery
- sqlalchemy
- redis
- boto3
- google-generativeai
- reportlab
- openpyxl

### Install missing packages:
```bash
cd E:/rappa-mvp/rappa-ai-mvp/backend
E:/rappa-mvp/.venv/Scripts/python.exe -m pip install -r requirements.txt
```

---

## 🔄 Restart Services

### Restart Backend (with code changes):
```bash
# Backend will auto-restart if --reload is enabled
# Otherwise, press Ctrl+C and run the command again
```

### Restart Celery (required after code changes):
```bash
# Celery does NOT auto-reload
# You must stop (Ctrl+C) and start again
```

---

## 📊 Monitor Services

### View Backend Logs:
Logs appear in Terminal 1 where backend is running

### View Celery Logs:
Logs appear in Terminal 2 where Celery is running

### View Task Status:
```bash
# In the Celery terminal, you'll see:
[2025-12-27 10:30:00,123: INFO] Task process_document[abc123] received
[2025-12-27 10:30:05,456: INFO] Task process_document[abc123] succeeded
```

---

## 🧪 Test Celery Worker

### Test with simple task:
```python
from app.workers.tasks import test_task

# Run test task
result = test_task.delay("Hello Celery!")
print(result.get())
```

### Test document processing:
```python
from app.workers.tasks import process_document

# Process job ID 1
result = process_document.delay(1)
print(result.get())
```

---

## 🎯 Development Workflow

### Typical workflow:

1. **Start services** (once)
   ```bash
   # Run start_all.bat
   # Or run commands manually
   ```

2. **Make code changes**
   - Backend changes: Auto-reloads ✅
   - Celery changes: Restart required ❌
   - Frontend changes: Auto-reloads ✅

3. **Test changes**
   - Use API docs: http://localhost:8001/docs
   - Use frontend: http://localhost:5173

4. **View logs**
   - Check terminal windows for errors

5. **Restart if needed**
   - Celery: Always restart after changes
   - Backend: Only if --reload not working
   - Frontend: Only if HMR not working

---

## 📝 Environment Variables

Required in `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rappa_db

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket

# Google Gemini
GOOGLE_API_KEY=your_gemini_api_key

# App Settings
DEBUG=True
SECRET_KEY=your_secret_key_here
```

---

## ✅ Pre-flight Checklist

Before starting services, ensure:

- [ ] PostgreSQL is running
- [ ] Redis is running (if using Redis)
- [ ] `.env` file configured
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Database migrations applied
- [ ] AWS credentials configured
- [ ] Gemini API key set

---

## 🚀 Production Deployment

For production, use these commands instead:

### Backend:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Celery:
```bash
celery -A app.workers.tasks worker --loglevel=warning --concurrency=4
```

**Note:** Don't use `--reload` or `--pool=solo` in production!

---

## 📞 Support

If you encounter issues:

1. Check logs in terminal windows
2. Verify all services are running
3. Check `.env` configuration
4. Review this document
5. Check GitHub issues

---

**Last Updated:** December 27, 2025
**Version:** 1.0.0
