@echo off
setlocal
echo =================================================================
echo  NKB SYSTEM - VPS PHASE 1 READ-ONLY INSPECTION
echo =================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\inspect_vps_phase1.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] SSH inspection script encountered an issue.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] VPS Phase 1 inspection telemetry captured!
pause
