@echo off
echo ========================================
echo  Killing Old Backend Processes
echo ========================================
echo.

echo Checking for processes on port 8001...
netstat -ano | findstr :8001

echo.
echo Killing process 98636...
taskkill /F /PID 98636

echo.
echo Checking again...
netstat -ano | findstr :8001

echo.
echo ========================================
echo  Cleanup Complete!
echo ========================================
echo.
echo You should now only see PID 94732
echo Press any key to exit...
pause >nul
