@echo off
setlocal

echo =================================================================
echo NKB MANUFACTURING -- ZERO-LOSS DATABASE MIGRATION LAUNCHER (V2)
echo Target Compose Project: nkb-manufacturing-staging
echo Target Database Port:    5433 (Isolated Local Staging Container)
echo Target Container:        nkb_mfg_staging_postgres
echo Target:                  scripts\migrate_json_to_postgres.cjs
echo =================================================================
echo.

if "%DB_PASSWORD%"=="" (
    echo [ERROR] DB_PASSWORD environment variable is not set!
    echo For security, passwords are never hardcoded in scripts or reports.
    echo Please set the staging database password for your current CMD session:
    echo.
    echo   set DB_PASSWORD=your_staging_password
    echo.
    echo Then re-run this script.
    exit /b 1
)

cd /d "%~dp0\.."

set DB_PORT=5433
set DB_HOST=127.0.0.1
set DB_NAME=nkb_scanner_db
set DB_USER=nkb_user
set NODE_PATH=%~dp0..\backend\node_modules

node scripts\migrate_json_to_postgres.cjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Migration failed with exit code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

echo.
echo =================================================================
echo Migration execution complete. Review logs above.
echo =================================================================
