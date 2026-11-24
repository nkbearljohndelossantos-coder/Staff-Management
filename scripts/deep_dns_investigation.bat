@echo off
setlocal
title NKB MANUFACTURING -- DEEP DNS INVESTIGATION

echo ==============================================================================
echo  NKB MANUFACTURING SYSTEM -- DEEP DNS INVESTIGATION (READ-ONLY)
echo  Domain:    m.nkbmanufacturing.com
echo  Target:    187.77.143.211
echo ==============================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\deep_dns_investigation.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] DNS investigation encountered an issue.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Deep DNS investigation completed successfully!
pause
