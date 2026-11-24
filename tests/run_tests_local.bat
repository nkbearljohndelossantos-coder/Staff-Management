@echo off
setlocal
title NKB MANUFACTURING -- LOCAL VERIFICATION TEST SUITE (SAFETY PATCH V2)

echo ==============================================================================
echo  NKB MANUFACTURING -- LOCAL VERIFICATION TEST RUNNER
echo  Target 1: Financial Reconciliation Patch V2 (tests\financial_reconciliation_patch.test.cjs)
echo  Target 2: ACID Rollback Verification (tests\acid_rollback.test.cjs)
echo  Target 3: Real PostgreSQL Integration (tests\staging_database_integration.test.cjs)
echo  Target 4: API Route and Health Check (tests\api_verification.test.cjs)
echo ==============================================================================
echo.

if "%DB_PASSWORD%"=="" (
    echo [ERROR] DB_PASSWORD environment variable is not set!
    echo For security, passwords are never hardcoded in scripts or reports.
    echo Please set the staging database password for your current CMD session:
    echo.
    echo   set DB_PASSWORD=your_staging_password
    echo.
    echo Then re-run this test runner.
    exit /b 1
)

cd /d "%~dp0\.."

set DB_PORT=5433
set DB_HOST=127.0.0.1
set DB_NAME=nkb_scanner_db
set DB_USER=nkb_user
set NODE_PATH=%~dp0..\backend\node_modules

echo --- Running Test 1: Financial Reconciliation Safety Patch V2 (10 Core Safety Tests) ---
node tests\financial_reconciliation_patch.test.cjs
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Test 1 failed! Halting test runner.
    exit /b %ERRORLEVEL%
)
echo.

echo --- Running Test 2: ACID Rollback and Atomicity Check ---
node tests\acid_rollback.test.cjs
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Test 2 failed! Halting test runner.
    exit /b %ERRORLEVEL%
)
echo.

echo --- Running Test 3: Real PostgreSQL Staging Integration Test Suite (10 Real DB Tests) ---
node tests\staging_database_integration.test.cjs
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Test 3 failed! Halting test runner.
    exit /b %ERRORLEVEL%
)
echo.

echo --- Running Test 4: API Route and Health Verification ---
start /B "" node backend\server.js > nul 2>&1
ping 127.0.0.1 -n 3 > nul
node tests\api_verification.test.cjs
set API_ERR=%ERRORLEVEL%
taskkill /F /IM node.exe /FI "WINDOWTITLE ne NKB*" > nul 2>&1

if %API_ERR% NEQ 0 (
    echo [ERROR] Test 4 failed!
    exit /b %API_ERR%
)
echo.

echo ==============================================================================
echo ALL 4 TEST SUITES COMPLETED SUCCESSFULLY -- 100%% PASS
echo ==============================================================================
