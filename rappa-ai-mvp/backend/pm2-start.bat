@echo off
REM PM2 Start Script for Rappa.AI Backend (Windows)
REM
REM Usage:
REM   pm2-start.bat dev     - Start in development mode
REM   pm2-start.bat prod    - Start in production mode
REM   pm2-start.bat watch   - Start in development with file watching

cd /d E:\rappa-mvp\rappa-ai-mvp\backend

if "%1"=="dev" (
    echo Starting Rappa.AI backend in DEVELOPMENT mode...
    pm2 start ecosystem.config.js --env development
    goto end
)

if "%1"=="prod" (
    echo Starting Rappa.AI backend in PRODUCTION mode...
    pm2 start ecosystem.config.js --env production
    goto end
)

if "%1"=="watch" (
    echo Starting Rappa.AI backend in DEVELOPMENT mode with FILE WATCHING...
    pm2 start ecosystem.config.js --env development --watch
    goto end
)

REM Default: development mode
echo Starting Rappa.AI backend in DEVELOPMENT mode (default)...
echo.
echo Usage:
echo   pm2-start.bat dev     - Development mode
echo   pm2-start.bat prod    - Production mode
echo   pm2-start.bat watch   - Development with file watching
echo.
pm2 start ecosystem.config.js --env development

:end
echo.
echo PM2 Status:
pm2 status
echo.
echo View logs: pm2 logs rappa-api
echo Stop app:  pm2 stop rappa-api
