@echo off
cd /d "%~dp0"
title CompliScan - Edge-AI Legal Metrology Compliance Scanner
echo ========================================================
echo   CompliScan - Edge-AI Legal Metrology Scanner
echo   Team: ^<AI-lite^>Outlaw (09B345)
echo   Problem Statement: SIH26034
echo ========================================================
echo.
echo Starting CompliScan Dev Server on Local Network...
echo (You can open the Network URL on your phone to test the app)
echo (Press Ctrl+C in this window when you wish to stop the server)
echo.
call npm run dev -- --host
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Server encountered an error.
  pause
)
pause
