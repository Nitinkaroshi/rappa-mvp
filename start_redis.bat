@echo off
echo Starting Redis in WSL with external access enabled...
wsl -e bash -c "redis-server --bind 0.0.0.0 --protected-mode no --tcp-keepalive 60"
pause
