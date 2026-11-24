# ==============================================================================
# NKB MANUFACTURING SYSTEM -- VPS PHASE 1.5 READ-ONLY VERIFICATION LAUNCHER
# Host: 187.77.143.211 | User: root
# Security: Strictly Read-Only (Zero State Mutation)
# ==============================================================================

$ErrorActionPreference = "Continue"

$VPS_HOST = "187.77.143.211"
$VPS_USER = "root"
$LOCAL_SCRIPT = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\scripts\inspect_vps_phase1_5.sh"
$OUTPUT_FILE = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\vps_inspection_phase1_5.utf8.txt"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " NKB SYSTEM -- VPS PHASE 1.5 READ-ONLY VERIFICATION" -ForegroundColor Cyan
Write-Host " Target: $VPS_USER@$VPS_HOST" -ForegroundColor Cyan
Write-Host " Mode:   Strictly Read-Only (Zero Mutation)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Execute inspection script over SSH and pipe output to UTF-8 file
Write-Host ""
Write-Host "Executing read-only Phase 1.5 verification over SSH..." -ForegroundColor Yellow
$telemetry = Get-Content -Raw $LOCAL_SCRIPT | ssh "$VPS_USER@$VPS_HOST" "bash -s"
$telemetry | Out-Host

[System.IO.File]::WriteAllText($OUTPUT_FILE, ($telemetry -join [Environment]::NewLine), [System.Text.Encoding]::UTF8)

if (Test-Path $OUTPUT_FILE) {
    $SIZE = (Get-Item $OUTPUT_FILE).Length
    Write-Host ""
    Write-Host "Phase 1.5 Telemetry captured successfully ($SIZE bytes)!" -ForegroundColor Green
    Write-Host "Report saved to: $OUTPUT_FILE" -ForegroundColor Green
} else {
    Write-Error "Failed to capture VPS Phase 1.5 telemetry."
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Phase 1.5 run complete." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
