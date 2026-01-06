@echo off
REM ============================================================================
REM PM2 Startup Script for Rappa.AI
REM ============================================================================
REM This script starts all services using PM2 process manager:
REM   1. Redis (WSL)
REM   2. FastAPI Backend (port 8001)
REM   3. Celery Worker
REM   4. Vite Frontend (port 5173)
REM
REM Usage:
REM   pm2-start.bat              - Start in development mode
REM   pm2-start.bat production   - Start in production mode
REM
REM Management:
REM   pm2 status                 - View all processes
REM   pm2 logs                   - View all logs
REM   pm2 logs rappa-api         - View specific service logs
REM   pm2 restart all            - Restart all services
REM   pm2 stop all               - Stop all services
REM   pm2 delete all             - Remove all from PM2
REM ============================================================================

echo.
echo ========================================
echo  Starting Rappa.AI Services with PM2
echo ========================================
echo.

cd /d E:\rappa-mvp\rappa-ai-mvp\backend

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PM2 is not installed!
    echo Please install PM2 globally: npm install -g pm2
    exit /b 1
)

REM Set environment (default: development)
set ENV_MODE=%1
if "%ENV_MODE%"=="" set ENV_MODE=development

echo Starting services in %ENV_MODE% mode...
echo.

REM Start all services from ecosystem config
pm2 start ecosystem.config.js --env %ENV_MODE%

echo.
echo ========================================
echo  Services Started!
echo ========================================
echo.

REM Show status
pm2 status

echo.
echo Useful commands:
echo   pm2 logs           - View all logs in real-time
echo   pm2 monit          - Interactive monitoring dashboard
echo   pm2 stop all       - Stop all services
echo   pm2 restart all    - Restart all services
echo.
