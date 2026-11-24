@echo off
setlocal
title NKB MANUFACTURING -- PHASE 1.5 READ-ONLY VERIFICATION

echo ==============================================================================
echo  NKB MANUFACTURING SYSTEM -- PHASE 1.5 READ-ONLY VERIFICATION
echo  Target VPS: 187.77.143.211 (root)
echo  Mode:       STRICTLY READ-ONLY (Zero Mutation)
echo ==============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\inspect_vps_phase1_5.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Phase 1.5 verification encountered an issue.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Phase 1.5 verification captured successfully!
pause
