@echo off
title EduTrack Server
echo ===================================================
echo Starting Training Management Server...
echo ===================================================

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing required packages. Please wait...
    call npm install
)

:: Start the server
echo Starting server...
echo Open http://localhost:3000 in your web browser.
echo ===================================================
call npx tsx server.ts

pause
