import os
import sys
import json
import paramiko

VPS_HOST = "187.77.143.211"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASSWORD = os.environ.get("VPS_PASSWORD", "")

if not VPS_PASSWORD:
    print("[ERROR] VPS_PASSWORD environment variable is required.")
    sys.exit(1)

print("=================================================================")
print(f" NKB MANUFACTURING -- READ-ONLY VPS DIAGNOSTIC")
print(f" Target: {VPS_USER}@{VPS_HOST}:{VPS_PORT}")
print(" Mode:   Strictly Read-Only (Zero Mutation)")
print("=================================================================\n")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print("[1/5] Connecting to VPS via SSH ...")
    client.connect(
        hostname=VPS_HOST,
        port=VPS_PORT,
        username=VPS_USER,
        password=VPS_PASSWORD,
        timeout=10,
        look_for_keys=False,
        allow_agent=False
    )
    print("      [SSH SUCCESS] Authenticated successfully as root.\n")
except paramiko.AuthenticationException as e:
    print(f"      [SSH AUTH FAILED] Authentication error: {e}")
    sys.exit(2)
except Exception as e:
    print(f"      [SSH CONN FAILED] Connection error: {e}")
    sys.exit(3)

def run_cmd(label, cmd):
    print(f"--- [{label}] Executing: {cmd} ---")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err:
        print(f"[STDERR] {err}")
    print()
    return out, err

try:
    # 1. Identity & System
    run_cmd("Identity", "whoami && hostname && uname -a")
    
    # 2. Docker Access & Version
    run_cmd("Docker Version", "docker version")
    run_cmd("Docker Compose Version", "docker compose version || docker-compose version")
    run_cmd("Docker Info (Summary)", "docker info --format '{{.ServerVersion}} | CPUs: {{.NCPU}} | Mem: {{.MemTotal}} | Containers: {{.Containers}}'")
    
    # 3. Existing Containers, Networks, Volumes
    run_cmd("Running Containers", "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'")
    run_cmd("All Containers (including stopped)", "docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'")
    run_cmd("Docker Networks", "docker network ls")
    run_cmd("Docker Volumes", "docker volume ls")
    
    # 4. Port Conflict Checks (39101, 39102) & Active Listeners
    run_cmd("Target Ports Check (39101, 39102)", "ss -tulpn | grep -E '39101|39102' || echo 'PORTS_FREE: Neither 39101 nor 39102 is currently listening.'")
    run_cmd("All Active TCP Listeners", "ss -tlpn")
    
    # 5. Proposed File/Directory Conflict Checks
    run_cmd("Proposed Path Check (/opt/nkb-manufacturing)", "ls -ld /opt/nkb-manufacturing 2>&1 || echo 'PATH_NOT_FOUND: /opt/nkb-manufacturing does not exist.'")
    run_cmd("Proposed NKB Containers Check", "docker ps -a --filter name=nkb --format 'table {{.Names}}\t{{.Status}}'")
    run_cmd("Proposed NKB Network Check", "docker network ls --filter name=nkb")
    
    # 6. Reverse Proxy & Web Server Inspection
    run_cmd("Web Servers / Reverse Proxy Processes", "ps aux | grep -E 'nginx|caddy|traefik|apache|httpd|openresty' | grep -v grep || echo 'NO_STANDARD_PROXY_PROCESS_FOUND'")
    run_cmd("Systemd Service Status (nginx / caddy / httpd)", "systemctl is-active nginx caddy httpd apache2 docker 2>&1")
    run_cmd("Nginx Configuration Test & Vhosts", "nginx -T 2>&1 | grep -E 'server_name|listen|proxy_pass' | grep -v '#' || echo 'NGINX_CHECK_COMPLETE'")

finally:
    client.close()
    print("=================================================================")
    print(" Read-only VPS inspection finished. SSH session closed.")
    print("=================================================================")
