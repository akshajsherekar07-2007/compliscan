@echo off
cd /d "%~dp0"
title CompliScan - Production Build Preview
echo ========================================================
echo   CompliScan - Production Mode (dist/)
echo ========================================================
echo.
echo [1/2] Building latest production bundle...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Build failed! Review error messages above.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Starting Production Preview on Local Network...
echo (Press Ctrl+C in this window when you wish to stop the server)
echo.
call npm run preview -- --host
if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Preview server encountered an error.
  pause
)
pause
