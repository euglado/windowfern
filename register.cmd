@echo off
cd /d "%~dp0"
call npm run register
if errorlevel 1 pause
