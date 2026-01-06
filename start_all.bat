@echo off
echo ========================================
echo  Starting Rappa.AI Backend Services
echo ========================================
echo.

REM Redis Server must be started manually in WSL
echo Redis managed manually...

REM Start Backend (FastAPI)
echo [1/3] Starting Backend Server...
start "Rappa.AI Backend" cmd /k "cd /d E:\rappa-mvp\rappa-ai-mvp\backend && E:\rappa-mvp\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Celery Worker
echo [2/3] Starting Celery Worker...
start "Rappa.AI Celery Worker" cmd /k "cd /d E:\rappa-mvp\rappa-ai-mvp\backend && E:\rappa-mvp\.venv\Scripts\python.exe -m celery -A app.workers.tasks worker --loglevel=info --pool=solo"

REM Wait 2 seconds for celery to initialize
timeout /t 2 /nobreak >nul

REM Start Frontend (Vite Dev Server)
echo [3/3] Starting Frontend Dev Server...
start "Rappa.AI Frontend" cmd /k "cd /d E:\rappa-mvp\rappa-ai-mvp\frontend && npm run dev"

echo.
echo ========================================
echo  Services Started Successfully!
echo ========================================
echo.
echo Redis Server:   localhost:6379 (WSL)
echo Backend API:    http://localhost:8001
echo API Docs:       http://localhost:8001/docs
echo Health Check:   http://localhost:8001/health
echo Frontend App:   http://localhost:5173
echo.
echo Press any key to exit this window...
echo (The services will continue running in separate windows)
pause >nul

