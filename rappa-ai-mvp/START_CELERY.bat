@echo off
echo ========================================
echo Starting Rappa.ai Celery Worker
echo ========================================
cd /d E:\rappa-mvp\rappa-ai-mvp\backend
call ..\..\.venv\Scripts\activate
echo.
echo Celery worker starting...
echo.
celery -A app.workers.tasks.celery_app worker --loglevel=info --pool=solo
