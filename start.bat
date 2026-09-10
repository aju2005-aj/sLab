@echo off
echo ==============================================
echo Smart Laboratory Equipment Fault Management
echo ==============================================

echo Note: Ensure you have run "npm install" in both backend and frontend folders.
echo Make sure Node.js is installed on your system.
echo.

start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm run dev"

echo Backend and Frontend servers are starting in new windows.
echo Frontend should be available at http://localhost:3000 (wait a few moments for Next.js to compile).
echo To access from other devices on the same Wi-Fi, find this PC's IPv4 address (e.g. 192.168.1.5) and go to http://192.168.1.5:3000 on your phone.
