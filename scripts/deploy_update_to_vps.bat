@echo off
setlocal
title NKB MANUFACTURING -- DEPLOY UPDATE TO VPS (187.77.143.211)

echo ==============================================================================
echo  NKB MANUFACTURING -- LIVE VPS DEPLOYMENT ENGINE
echo  Target VPS: 187.77.143.211 (srv1931373.hstgr.cloud)
echo  Deploying:  Updated Canteen Pricing Patch (Frontend dist + Backend API)
echo ==============================================================================
echo.

if "%VPS_PASSWORD%"=="" (
    set /p VPS_PASSWORD="Enter VPS root password for 187.77.143.211: "
)

if "%VPS_PASSWORD%"=="" (
    echo [ERROR] VPS password is required to deploy.
    pause
    exit /b 1
)

cd /d "%~dp0\.."

python scripts\deploy_update_to_vps.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] VPS Deployment failed! Review the output above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] VPS update successfully deployed and verified!
pause
