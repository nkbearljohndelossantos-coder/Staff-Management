@echo off
setlocal
title NKB MANUFACTURING -- REAL STAGING POSTGRESQL VERIFICATION RUNNER

echo ==============================================================================
echo  NKB MANUFACTURING -- REAL DATABASE VERIFICATION RUNNER (POST-MIGRATION)
echo  Target Container: nkb_mfg_staging_postgres
echo  Target Database:  nkb_scanner_db
echo  Script:           tests\verify_staging_database.sql
echo ==============================================================================
echo.

cd /d "%~dp0\.."

docker exec -i nkb_mfg_staging_postgres psql -U nkb_user -d nkb_scanner_db < tests\verify_staging_database.sql
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Database verification assertions failed with exit code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo Verification runner complete. Review assertion outputs above.
echo ==============================================================================
