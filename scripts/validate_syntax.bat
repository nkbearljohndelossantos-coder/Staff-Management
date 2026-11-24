@echo off
setlocal
echo =================================================================
echo  NKB SYSTEM - POWERSHELL PARSER VALIDATION
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\validate_syntax.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Syntax validation detected errors!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] PowerShell syntax validation PASSED.
pause
