@echo off
title Raitha Mitra - Setup & Start
color 0A
echo.
echo  ====================================
echo    RAITHA MITRA - Starting...
echo  ====================================
echo.

echo [1/4] Installing root dependencies...
call npm install
if errorlevel 1 ( echo ERROR: Root install failed & pause & exit /b 1 )

echo.
echo [2/4] Installing server dependencies...
cd server
call npm install
if errorlevel 1 ( echo ERROR: Server install failed & pause & exit /b 1 )
cd ..

echo.
echo [3/4] Installing client dependencies...
cd client
call npm install
if errorlevel 1 ( echo ERROR: Client install failed & pause & exit /b 1 )
cd ..

echo.
echo [4/4] Starting servers...
echo   Backend  -> http://localhost:5000
echo   Frontend -> http://localhost:3000
echo.
echo  Press Ctrl+C to stop
echo  ====================================
echo.

start "Raitha Mitra - Backend" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "Raitha Mitra - Frontend" cmd /k "cd client && npm start"

echo Both servers are starting in separate windows.
echo Frontend will open in your browser automatically.
pause
