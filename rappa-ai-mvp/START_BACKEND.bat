@echo off
echo ========================================
echo Starting Rappa.ai Backend Server
echo ========================================
cd /d E:\rappa-mvp\rappa-ai-mvp\backend
call ..\..\.venv\Scripts\activate
echo.
echo Backend server starting on http://localhost:8001
echo.
uvicorn app.main:app --reload --port 8001
