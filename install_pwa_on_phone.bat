@echo off
cd /d "%~dp0"
title CompliScan - PWA Secure Installer
echo ========================================================
echo   CompliScan - Secure PWA Installer for Phone
echo ========================================================
echo.
echo Chrome on Android blocks PWA installation over standard Wi-Fi IPs 
echo because it requires a secure HTTPS connection.
echo.
echo This script will create a secure, temporary HTTPS tunnel to your 
echo local preview server so you can install the PWA.
echo.
echo Please ensure 'preview_production.bat' is ALREADY RUNNING in 
echo another window before proceeding!
echo.
pause

echo.
echo Generating secure HTTPS link...
echo (Type the resulting link exactly into Chrome on your phone)
echo.
call npx localtunnel --port 4173
pause
