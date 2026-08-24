@echo off
chcp 65001 >nul
title JustWord Frontend

echo ============================================
echo   JustWord Frontend
echo ============================================
echo.

::cd /d F:\Dev\JustWord-frontend
cd /d "%~dp0"

if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Expected:
    echo F:\Dev\JustWord-frontend\package.json
    pause
    exit /b 1
)

echo Starting Frontend...
echo URL: http://localhost:5173
echo.

npm run dev

pause