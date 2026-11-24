@echo off
setlocal
title NKB MANUFACTURING -- PHASE 1 READ-ONLY INSPECTION

echo ==============================================================================
echo  NKB MANUFACTURING SYSTEM -- PHASE 1 READ-ONLY INSPECTION ONLY
echo  Target VPS:    187.77.143.211 (root)
echo  Target Domain: m.nkbmanufacturing.com
echo  Mode:          STRICTLY READ-ONLY (Zero Mutation)
echo ==============================================================================
echo.

echo [STEP 1/3] Executing Standard DNS Resolution Audit...
call "%~dp0check_dns.bat"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] DNS check reported an issue or warning.
)

echo.
echo [STEP 2/3] Executing Deep Authoritative DNS Investigation...
call "%~dp0deep_dns_investigation.bat"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Deep DNS investigation reported an issue.
)

echo.
echo [STEP 3/3] Executing VPS Read-Only Telemetry Inspection...
call "%~dp0inspect_vps_phase1.bat"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] VPS SSH inspection encountered an issue.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo  PHASE 1 COMPLETE TELEMETRY CAPTURE FINISHED!
echo  Telemetry captured to:
echo    - dns_audit_output.txt
echo    - dns_investigation_report.txt
echo    - vps_inspection_output.txt
echo ==============================================================================
echo Antigravity is now ready to parse and generate the Phase 1 Isolation Report.
pause
