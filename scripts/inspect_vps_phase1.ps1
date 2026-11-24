# ==============================================================================
# NKB MANUFACTURING SYSTEM -- VPS PHASE 1 INSPECTION LAUNCHER (POWERSHELL)
# Host: 187.77.143.211 | User: root
# Security: Zero Secret Exposure | Non-Destructive Read-Only
# ==============================================================================

$ErrorActionPreference = "Continue"

$VPS_HOST = "187.77.143.211"
$VPS_USER = "root"
$LOCAL_SCRIPT = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\inspect_vps_phase1.sh"
$OUTPUT_FILE = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\vps_inspection_output.txt"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " NKB SYSTEM -- VPS PHASE 1 READ-ONLY INSPECTION" -ForegroundColor Cyan
Write-Host " Target: $VPS_USER@$VPS_HOST" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Test basic SSH connectivity
Write-Host ""
Write-Host "[1/3] Testing SSH connectivity to $VPS_HOST..." -ForegroundColor Yellow
$SSH_TEST = ssh -o BatchMode=yes -o ConnectTimeout=8 "$VPS_USER@$VPS_HOST" "echo 'SSH_CONNECTION_SUCCESSFUL'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "[NOTICE] Standard batch key login did not immediately return success ($SSH_TEST)." -ForegroundColor DarkYellow
    Write-Host "Invoking standard interactive SSH session to execute read-only telemetry..." -ForegroundColor Yellow
}

# 2. Execute inspection script over SSH and pipe output to file
Write-Host ""
Write-Host "[2/3] Executing read-only inspection commands..." -ForegroundColor Yellow
$telemetry = Get-Content -Raw $LOCAL_SCRIPT | ssh "$VPS_USER@$VPS_HOST" "bash -s"
$telemetry | Out-Host
[System.IO.File]::WriteAllText($OUTPUT_FILE, ($telemetry -join [Environment]::NewLine), [System.Text.Encoding]::UTF8)

if (Test-Path $OUTPUT_FILE) {
    $SIZE = (Get-Item $OUTPUT_FILE).Length
    Write-Host ""
    Write-Host "[3/3] Telemetry captured successfully ($SIZE bytes)!" -ForegroundColor Green
    Write-Host "Report saved to: $OUTPUT_FILE" -ForegroundColor Green
} else {
    Write-Error "Failed to capture VPS telemetry."
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Phase 1 inspection run complete. Antigravity can now parse output." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
