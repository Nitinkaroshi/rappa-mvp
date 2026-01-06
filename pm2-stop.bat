@echo off
REM ============================================================================
REM PM2 Stop Script for Rappa.AI
REM ============================================================================
REM This script stops all PM2-managed services
REM ============================================================================

echo.
echo ========================================
echo  Stopping Rappa.AI Services
echo ========================================
echo.

REM Stop all PM2 processes
pm2 stop all

echo.
echo ========================================
echo  All Services Stopped!
echo ========================================
echo.

REM Show status
pm2 status

echo.
echo To remove services from PM2: pm2 delete all
echo To start again: pm2-start.bat
echo.
