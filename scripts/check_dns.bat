@echo off
setlocal
echo =================================================================
echo  NKB SYSTEM - DNS RESOLUTION AUDIT
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\check_dns.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] DNS audit encountered an issue.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] DNS audit finished.
pause
