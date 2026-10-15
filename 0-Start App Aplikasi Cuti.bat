@echo off
if "%1" == "minimized" goto :minimized
start /min cmd /c "%~dpnx0" minimized
exit

:minimized
echo Starting E-Cuti Application...

:: Start Backend Server minimized
echo Starting Backend Server (Port 3002)...
start /min "E-Cuti Backend" cmd /k "npm run server"

:: Start Frontend (Vite) minimized
echo Starting Frontend (Port 9999)...
start /min "E-Cuti Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo  Aplikasi berhasil dijalankan!
echo  Langsung minimize dalam 2 detik...
echo ===================================================

timeout /t 2 /nobreak >nul
exit
