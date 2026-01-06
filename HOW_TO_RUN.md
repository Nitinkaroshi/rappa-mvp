# 🚀 Rappa.AI - Complete Running Guide

**Last Updated:** January 1, 2026  
**Status:** ✅ All Services Running Successfully

---

## 📋 Quick Summary

**Rappa.AI** is an intelligent document processing platform for Indian documents using AI-powered field extraction.

### Current Status
- ✅ **Backend API**: Running on `http://localhost:8001`
- ✅ **Frontend UI**: Running on `http://localhost:5173`
- ✅ **Celery Worker**: Processing background tasks
- ✅ **Redis**: Running on WSL (192.168.155.5:6379)

### Your Credentials
- **Email:** nitinkumar@formonex.in
- **Password:** Nitin@007
- **Credits:** 971 remaining

---

## 🎯 How to Start the Project

### Method 1: Using PM2 (Recommended - Easiest)

**Step 1:** Open PowerShell/Terminal in the project root:
```powershell
cd e:\rappa-mvp
```

**Step 2:** Start all services with one command:
```powershell
cd rappa-ai-mvp\backend
pm2 start ecosystem.config.js
```

**Step 3:** Check if services are running:
```powershell
pm2 status
```

You should see:
- ✅ `rappa-redis` - Redis server
- ✅ `rappa-api` - Backend API
- ✅ `rappa-celery` - Background worker
- ✅ `rappa-ui` - Frontend

**Step 4:** Open your browser and go to:
- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:8001/docs

---

### Method 2: Using Batch File

**Option A:** Double-click this file:
```
e:\rappa-mvp\start_all_pm2.bat
```

**Option B:** Run from command line:
```powershell
cd e:\rappa-mvp
.\start_all_pm2.bat
```

---

### Method 3: Manual Start (For Development)

If you want to run services individually for debugging:

**Terminal 1 - Backend:**
```powershell
cd e:\rappa-mvp\rappa-ai-mvp\backend
E:\rappa-mvp\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Terminal 2 - Celery Worker:**
```powershell
cd e:\rappa-mvp\rappa-ai-mvp\backend
E:\rappa-mvp\.venv\Scripts\python.exe -m celery -A app.workers.tasks worker --loglevel=info --pool=solo
```

**Terminal 3 - Frontend:**
```powershell
cd e:\rappa-mvp\rappa-ai-mvp\frontend
npm run dev
```

---

## 🛑 How to Stop the Project

### Stop All PM2 Services:
```powershell
pm2 stop all
```

### Delete All PM2 Services (Clean Stop):
```powershell
pm2 delete all
```

### Stop Individual Service:
```powershell
pm2 stop rappa-api      # Stop backend
pm2 stop rappa-celery   # Stop worker
pm2 stop rappa-ui       # Stop frontend
pm2 stop rappa-redis    # Stop Redis
```

### Manual Stop:
Press `Ctrl+C` in each terminal window where services are running.

---

## 📊 Monitoring & Logs

### View PM2 Status:
```powershell
pm2 status
```

### View Logs (All Services):
```powershell
pm2 logs
```

### View Logs (Specific Service):
```powershell
pm2 logs rappa-api      # Backend logs
pm2 logs rappa-celery   # Worker logs
pm2 logs rappa-ui       # Frontend logs
```

### View Last 50 Lines:
```powershell
pm2 logs --lines 50
```

### Monitor in Real-time:
```powershell
pm2 monit
```

---

## 🔍 Service URLs & Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application UI |
| **Backend API** | http://localhost:8001 | FastAPI server |
| **API Docs (Swagger)** | http://localhost:8001/docs | Interactive API documentation |
| **API Docs (Redoc)** | http://localhost:8001/redoc | Alternative API docs |
| **Health Check** | http://localhost:8001/health | Backend health status |

---

## 🎨 Application Features

### Dashboard Overview
After logging in, you'll see:

1. **Statistics:**
   - Total Documents: 39
   - Pending: 11
   - Completed: 8
   - Success Rate: 20.5%

2. **Navigation:**
   - 📊 Dashboard - Main overview
   - 📄 Documents - All uploaded documents
   - ⬆️ Upload - Add new documents
   - 📝 Custom Templates - Template management
   - 📦 Batches - Grouped processing
   - 💳 Credits - Balance (971 credits)
   - ⚙️ Settings & Help

3. **Document Processing:**
   - Upload PDF, JPG, PNG, TIFF files
   - AI extraction in ~6 seconds
   - View/Edit extracted fields
   - Export to CSV, JSON, Excel, PDF

### Supported Document Types
1. **GST Invoice** - 14 fields
2. **Bank Statement** - 11 fields
3. **Aadhaar Card** - 7 fields
4. **PAN Card** - 4 fields
5. **Purchase Order** - 9 fields
6. **Salary Slip** - 16 fields

---

## 🐛 Troubleshooting

### Issue 1: Port Already in Use

**Error:** `Port 8001 is already in use`

**Solution:**
```powershell
# Find process using port 8001
netstat -ano | findstr :8001

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Restart services
pm2 restart all
```

---

### Issue 2: Frontend Can't Connect to Backend

**Error:** `ERR_CONNECTION_REFUSED` or `Login failed`

**Check 1:** Verify backend is running:
```powershell
pm2 status
# Look for rappa-api with status "online"
```

**Check 2:** Test backend health:
```powershell
curl http://localhost:8001/health
```

**Check 3:** Verify API URL in frontend:
- File: `e:\rappa-mvp\rappa-ai-mvp\frontend\src\services\api.js`
- Line 10 should be: `const API_BASE_URL = 'http://localhost:8001';`

**Solution:** If backend is on different port, update the API_BASE_URL.

---

### Issue 3: Celery Worker Not Processing

**Error:** Jobs stuck in "queued" status

**Check:** Celery worker status:
```powershell
pm2 logs rappa-celery
```

**Solution:** Restart Celery:
```powershell
pm2 restart rappa-celery
```

---

### Issue 4: Redis Connection Failed

**Error:** `Connection refused` to Redis

**Check:** Redis is running:
```powershell
pm2 status
# Look for rappa-redis with status "online"
```

**Solution:** Restart Redis:
```powershell
pm2 restart rappa-redis
```

---

### Issue 5: PM2 Not Found

**Error:** `pm2: The term 'pm2' is not recognized`

**Solution:** Install PM2 globally:
```powershell
npm install -g pm2
```

---

### Issue 6: Database Connection Error

**Error:** `Could not connect to database`

**Check:** PostgreSQL service:
```powershell
# Check if PostgreSQL is running
sc query postgresql-x64-13
```

**Solution:** Start PostgreSQL service or check `.env` file for correct database credentials.

---

## 🔧 Configuration Files

### Backend Configuration
- **File:** `e:\rappa-mvp\rappa-ai-mvp\backend\.env`
- Contains: Database URL, Redis URL, API keys, etc.

### PM2 Configuration
- **File:** `e:\rappa-mvp\rappa-ai-mvp\backend\ecosystem.config.js`
- Manages: All service processes, ports, environment variables

### Frontend Configuration
- **File:** `e:\rappa-mvp\rappa-ai-mvp\frontend\vite.config.js`
- **API Config:** `e:\rappa-mvp\rappa-ai-mvp\frontend\src\services\api.js`

---

## 📦 Technology Stack

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database
- **Redis** - Message broker (on WSL)
- **Celery** - Background tasks
- **Google Gemini 2.0 Flash** - AI extraction
- **Backblaze B2** - File storage

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - API calls
- **Lucide React** - Icons

---

## 🔐 Security Notes

- ✅ JWT token authentication
- ✅ HTTP-only cookies (secure)
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Input validation

---

## 📈 Performance Metrics

- **Document Upload:** <1 second
- **AI Processing:** ~6 seconds
- **API Response:** <200ms
- **Credit Cost:** 2 credits per document

---

## 🎯 Common Tasks

### Restart Everything:
```powershell
pm2 restart all
```

### View All Logs:
```powershell
pm2 logs --lines 100
```

### Check Service Health:
```powershell
# Backend
curl http://localhost:8001/health

# Frontend (should return HTML)
curl http://localhost:5173
```

### Clear PM2 Logs:
```powershell
pm2 flush
```

### Save PM2 Configuration:
```powershell
pm2 save
```

### Auto-start PM2 on Boot:
```powershell
pm2 startup
```

---

## 📞 Need Help?

### Check Logs First:
```powershell
pm2 logs --lines 50
```

### Verify All Services:
```powershell
pm2 status
```

### Test Backend:
```powershell
curl http://localhost:8001/health
```

### Test Frontend:
Open browser: http://localhost:5173

---

## 🎉 Success Checklist

After starting the project, verify:

- [ ] PM2 shows all 4 services as "online"
- [ ] Backend health check returns `{"status":"healthy"}`
- [ ] Frontend loads at http://localhost:5173
- [ ] Can login with your credentials
- [ ] Dashboard shows statistics and documents
- [ ] Can upload and process documents

---

## 📝 Quick Reference Commands

```powershell
# Start all services
cd e:\rappa-mvp\rappa-ai-mvp\backend
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Delete all (clean stop)
pm2 delete all

# Monitor
pm2 monit
```

---

## 🚀 You're All Set!

Your Rappa.AI application is now running successfully. Enjoy processing documents with AI! 🎊

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:8001/docs

---

**Made with ❤️ by Rappa.AI Team**
