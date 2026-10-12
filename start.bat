@echo off
echo ==========================================
echo    Starting TravelMind AI Application
echo ==========================================
echo.
echo 1. Launching Express Backend Server (Port 5000)...
start "TravelMind Server" cmd /k "cd /d %~dp0server && npm run dev"

echo 2. Launching Vite Frontend Client (Port 5173)...
start "TravelMind Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ==========================================
echo Application started successfully!
echo Frontend URL: http://localhost:5173
echo Backend API:  http://localhost:5000/api
echo ==========================================
pause
