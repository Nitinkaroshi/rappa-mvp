@echo off
echo ==================================================
echo RAPPA.AI - Structured Local Start (via PM2)
echo ==================================================

echo 1. Installing PM2 (if needed)...
call npm install -g pm2

echo 2. Starting Services (Backend, Celery, Frontend)...
cd rappa-ai-mvp\backend
call pm2 start ecosystem.config.js

echo ==================================================
echo Services Started!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo ==================================================
echo Opening Monitor...
call pm2 monit
