@echo off
echo Stopping API server (PID 50684)...
taskkill /PID 50684 /F
timeout /t 2
echo Starting API server...
cd API
start cmd /k "npm run dev"
echo API server restarted!
