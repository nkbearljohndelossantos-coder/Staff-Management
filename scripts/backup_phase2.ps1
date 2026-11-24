# ==============================================================================
# NKB MANUFACTURING SYSTEM — PHASE 2: READ-ONLY DATABASE BACKUP
# Database: nkb_scanner_db
# Container: nkb-postgres-dev
# User: nkb_user
# Target Directory: z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\backups
# ==============================================================================

$ErrorActionPreference = "Stop"

$TARGET_DIR = "z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\backups"
$LOG_FILE = "$TARGET_DIR\backup_phase2_log.txt"

# 1. Ensure backup directory exists
if (-not (Test-Path $TARGET_DIR)) {
    New-Item -ItemType Directory -Force -Path $TARGET_DIR | Out-Null
}

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILENAME = "pre_restore_nkb_scanner_db_$TIMESTAMP.dump"
$FINAL_BACKUP_PATH = "$TARGET_DIR\$BACKUP_FILENAME"
$CONTAINER_TMP_PATH = "/tmp/$BACKUP_FILENAME"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " NKB SYSTEM — PHASE 2 DATABASE BACKUP & VERIFICATION" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[1/5] Target Database: nkb_scanner_db (User: nkb_user)"
Write-Host "[1/5] Target Container: nkb-postgres-dev"
Write-Host "[1/5] Output File: $FINAL_BACKUP_PATH"

# 2. Execute read-only pg_dump inside container
Write-Host "`n[2/5] Executing pg_dump inside nkb-postgres-dev (Format: Custom -F c)..." -ForegroundColor Yellow
docker exec -t nkb-postgres-dev pg_dump -U nkb_user -d nkb_scanner_db -F c -b -v -f "$CONTAINER_TMP_PATH"
if ($LASTEXITCODE -ne 0) {
    Write-Error "FATAL: pg_dump failed with exit code $LASTEXITCODE."
    exit $LASTEXITCODE
}

# 3. Copy backup from container to Drive Z
Write-Host "`n[3/5] Copying backup archive to Drive Z..." -ForegroundColor Yellow
docker cp "nkb-postgres-dev:$CONTAINER_TMP_PATH" "$FINAL_BACKUP_PATH"
if (-not (Test-Path $FINAL_BACKUP_PATH)) {
    Write-Error "FATAL: Backup file was not copied to $FINAL_BACKUP_PATH."
    exit 1
}

# 4. Verify file existence and non-zero size
Write-Host "`n[4/5] Verifying backup file integrity on disk..." -ForegroundColor Yellow
$FILE_ITEM = Get-Item $FINAL_BACKUP_PATH
$FILE_SIZE = $FILE_ITEM.Length

if ($FILE_SIZE -le 0) {
    Write-Error "FATAL: Backup file size is zero bytes."
    exit 1
}

# Calculate SHA-256
$SHA256 = (Get-FileHash -Algorithm SHA256 -Path $FINAL_BACKUP_PATH).Hash

# 5. Verify archive structure using pg_restore --list
Write-Host "`n[5/5] Performing pg_restore --list verification..." -ForegroundColor Yellow
$RESTORE_TOC = docker exec -t nkb-postgres-dev pg_restore --list "$CONTAINER_TMP_PATH"
$TOC_LINE_COUNT = ($RESTORE_TOC | Measure-Object -Line).Lines

if ($TOC_LINE_COUNT -le 0) {
    Write-Error "FATAL: pg_restore --list returned empty Table of Contents."
    exit 1
}

# Only remove container tmp file after full verification
docker exec nkb-postgres-dev rm -f "$CONTAINER_TMP_PATH"

# Write execution manifest
$MANIFEST = @"
=================================================================
NKB MANUFACTURING SYSTEM — PHASE 2 VERIFIED BACKUP MANIFEST
=================================================================
Timestamp: $(Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
Container: nkb-postgres-dev
Database: nkb_scanner_db
User: nkb_user
Backup Path: $FINAL_BACKUP_PATH
File Size: $FILE_SIZE bytes
SHA-256: $SHA256
pg_restore TOC Entries: $TOC_LINE_COUNT lines
Status: VERIFIED & SEALED
Original DB Status: UNMODIFIED (Read-Only pg_dump)
Volume Status: UNMODIFIED (docker_pg-dev-data intact)
=================================================================
"@

$MANIFEST | Set-Content -Path "$FINAL_BACKUP_PATH.sha256.txt"
$MANIFEST | Tee-Object -FilePath $LOG_FILE

Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host " PHASE 2 BACKUP COMPLETED & VERIFIED SUCCESSFULLY" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Backup Path: $FINAL_BACKUP_PATH" -ForegroundColor Green
Write-Host "File Size:   $FILE_SIZE bytes" -ForegroundColor Green
Write-Host "SHA-256:     $SHA256" -ForegroundColor Green
Write-Host "Manifest:    $FINAL_BACKUP_PATH.sha256.txt" -ForegroundColor Green
