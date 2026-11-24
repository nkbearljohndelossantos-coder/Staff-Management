@echo off
setlocal
title NKB MANUFACTURING -- LOCAL ENVIRONMENT PREFLIGHT SAFETY CHECK

echo ==============================================================================
echo  NKB MANUFACTURING -- LOCAL STAGING ENVIRONMENT PREFLIGHT CHECK
echo  Checking port 5433, Docker container, and volume isolation
echo  Mode: Strictly Read-Only Inspection (Zero Mutation)
echo ==============================================================================
echo.

echo [1/3] Checking if TCP Port 5433 is occupied...
netstat -ano | findstr :5433
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 5433 appears to be OCCUPIED by an active process!
) else (
    echo [PASS] Port 5433 is FREE and available for isolated staging.
)
echo.

echo [2/3] Checking for existing Docker containers named 'nkb_staging_postgres'...
docker ps -a --filter "name=nkb_staging_postgres" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [3/3] Checking for existing Docker volumes named 'nkb_staging_postgres_data'...
docker volume ls --filter "name=nkb_staging_postgres_data"
echo.

echo ==============================================================================
echo Preflight check complete. Review results above before launching staging.
echo ==============================================================================
pause
