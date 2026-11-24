@echo off
setlocal
echo =================================================================
echo  NKB SYSTEM - PHASE 2 DATABASE BACKUP
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\backup_phase2.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backup execution failed.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Backup execution finished.
pause
