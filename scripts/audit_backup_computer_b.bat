@echo off
setlocal
title NKB MANUFACTURING -- INDEPENDENT BACKUP INTEGRITY AUDIT

echo ==============================================================================
echo  NKB MANUFACTURING SYSTEM -- INDEPENDENT BACKUP INTEGRITY AUDIT
echo  Target: NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json
echo  Mode:   STRICTLY READ-ONLY (Zero Mutation)
echo ==============================================================================
echo.

node "%~dp0audit_backup_computer_b.cjs"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backup audit script encountered an issue.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Backup audit completed! Reports written to backup_audit_report.txt and .json.
pause
