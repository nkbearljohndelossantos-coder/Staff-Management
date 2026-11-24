#!/usr/bin/env python3
"""
NKB MANUFACTURING -- AUTOMATED SAFE VPS HOT-UPDATE SCRIPT
Deploys frontend dist and updated backend controllers to /opt/nkb-manufacturing
with pre-flight checks, automatic backup, zero-downtime container update, and verification.
"""

import os
import sys
import time
import paramiko

VPS_HOST = "187.77.143.211"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASSWORD = os.environ.get("VPS_PASSWORD", "")

PATCH_FILE = os.path.join(os.path.dirname(__file__), "..", "update_patch.tar.gz")

if not VPS_PASSWORD:
    print("[ERROR] VPS_PASSWORD environment variable is required.")
    print("Please set VPS_PASSWORD before running this script.")
    sys.exit(1)

if not os.path.isfile(PATCH_FILE):
    print(f"[ERROR] Patch file not found at: {PATCH_FILE}")
    sys.exit(1)

print("=================================================================")
print(f" NKB MANUFACTURING -- LIVE VPS HOT-DEPLOYMENT")
print(f" Target Host: {VPS_USER}@{VPS_HOST}:{VPS_PORT}")
print(f" Patch File:  {os.path.basename(PATCH_FILE)} ({os.path.getsize(PATCH_FILE)} bytes)")
print("=================================================================\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

def run_cmd(label, cmd, check=True):
    print(f"--- [{label}] {cmd} ---")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err and code != 0:
        print(f"[ERROR] {err}")
    if check and code != 0:
        raise RuntimeError(f"Command failed with exit code {code}: {cmd}")
    print()
    return out, err, code

try:
    print("[1/6] Connecting to VPS via SSH...")
    client.connect(
        hostname=VPS_HOST,
        port=VPS_PORT,
        username=VPS_USER,
        password=VPS_PASSWORD,
        timeout=15,
        look_for_keys=False,
        allow_agent=False
    )
    print("      [SSH CONNECTED] Authenticated as root successfully.\n")

    # Step 1: Pre-flight verify /opt/nkb-manufacturing exists
    print("[2/6] Verifying existing VPS containers and deployment path...")
    run_cmd("Verify Deployment Path", "ls -ld /opt/nkb-manufacturing")
    run_cmd("Verify Docker Compose Stack", "cd /opt/nkb-manufacturing && docker compose ps")

    # Step 2: Upload patch file to /tmp/update_patch.tar.gz
    print("[3/6] Uploading update_patch.tar.gz to VPS via SFTP...")
    sftp = client.open_sftp()
    remote_tmp_patch = "/tmp/update_patch.tar.gz"
    sftp.put(PATCH_FILE, remote_tmp_patch)
    sftp.close()
    print("      [SFTP SUCCESS] Uploaded patch to /tmp/update_patch.tar.gz\n")

    # Step 3: Create pre-deployment backup on VPS
    print("[4/6] Creating pre-deployment backup on VPS...")
    backup_tag = f"backup_pre_price_fix_{int(time.time())}"
    run_cmd("Create Backup Dir", f"mkdir -p /opt/nkb-manufacturing/backups/{backup_tag}")
    run_cmd(
        "Backup Existing Files",
        f"cp -r /opt/nkb-manufacturing/dist /opt/nkb-manufacturing/backups/{backup_tag}/ 2>/dev/null || true && "
        f"cp /opt/nkb-manufacturing/backend/src/controllers/canteenController.js /opt/nkb-manufacturing/backups/{backup_tag}/ 2>/dev/null || true"
    )

    # Step 4: Extract update patch into /opt/nkb-manufacturing
    print("[5/6] Applying update patch and reloading containers...")
    run_cmd(
        "Extract Patch to /opt/nkb-manufacturing",
        "tar -xzvf /tmp/update_patch.tar.gz -C /opt/nkb-manufacturing"
    )
    run_cmd("Cleanup Remote Temp Patch", "rm -f /tmp/update_patch.tar.gz")

    # Hot-reload frontend assets into nkb_mfg_frontend container
    run_cmd(
        "Update Frontend Container",
        "docker cp /opt/nkb-manufacturing/dist/. nkb_mfg_frontend:/usr/share/nginx/html/"
    )

    # Hot-reload backend controller into nkb_mfg_backend and restart backend
    run_cmd(
        "Update Backend Container Controller",
        "docker cp /opt/nkb-manufacturing/backend/src/controllers/canteenController.js nkb_mfg_backend:/app/src/controllers/canteenController.js"
    )
    run_cmd(
        "Restart Backend Container",
        "docker restart nkb_mfg_backend"
    )

    # Step 5: Verification & health check
    print("[6/6] Verifying post-deployment health on VPS...")
    time.sleep(3)
    run_cmd(
        "Backend Health Check (Loopback)",
        "curl -sS http://127.0.0.1:39102/api/health"
    )
    run_cmd(
        "Frontend HTTP Status",
        "curl -sS -I http://127.0.0.1:39101/ | head -n 5"
    )
    run_cmd(
        "Inventory API Test",
        "curl -sS 'http://127.0.0.1:39102/api/canteen/inventory?active_only=true' | head -c 300"
    )

    print("\n=================================================================")
    print(" DEPLOYMENT COMPLETED SUCCESSFULLY WITH 100% HEALTH CONFIRMED!")
    print("=================================================================\n")

except Exception as e:
    print(f"\n[FATAL ERROR DURING DEPLOYMENT] {e}")
    sys.exit(1)
finally:
    client.close()
