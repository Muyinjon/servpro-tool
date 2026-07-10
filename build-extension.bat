@echo off
setlocal
cd /d "%~dp0"

echo.
echo  ServPro Helper - Chrome extension packager
echo  ==========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dist\build.ps1"
if errorlevel 1 (
    echo.
    echo Build FAILED.
    pause
    exit /b 1
)

echo.
echo Opening dist folder - upload the .zip to Chrome Web Store / Developer Dashboard.
explorer "%~dp0dist"

pause
