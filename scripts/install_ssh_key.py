import os
import sys
import paramiko

VPS_HOST = "187.77.143.211"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASSWORD = os.environ.get("VPS_PASSWORD", "")

PUBLIC_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHHF1LapMszXer8E6KNm67wIz0xWCUlZh1TPQfj41AQa nkb-deploy-automation@workstation"

if not VPS_PASSWORD:
    print("[ERROR] VPS_PASSWORD environment variable is required.")
    sys.exit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to {VPS_USER}@{VPS_HOST} to install verified public key...")
    client.connect(
        hostname=VPS_HOST,
        port=VPS_PORT,
        username=VPS_USER,
        password=VPS_PASSWORD,
        timeout=10,
        look_for_keys=False,
        allow_agent=False
    )
    
    # 1. Ensure ~/.ssh directory exists with 700 permissions
    client.exec_command("mkdir -p /root/.ssh && chmod 700 /root/.ssh")
    
    # 2. Check if key is already in authorized_keys
    stdin, stdout, stderr = client.exec_command("cat /root/.ssh/authorized_keys 2>/dev/null || true")
    current_keys = stdout.read().decode('utf-8')
    
    if PUBLIC_KEY.strip() in current_keys:
        print("[ALREADY INSTALLED] Public key already present in /root/.ssh/authorized_keys.")
    else:
        # Append key securely
        append_cmd = f"echo '{PUBLIC_KEY.strip()}' >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys"
        stdin, stdout, stderr = client.exec_command(append_cmd)
        err = stderr.read().decode('utf-8')
        if err:
            raise Exception(f"Failed to append key: {err}")
        print("[SUCCESS] Public key successfully appended to /root/.ssh/authorized_keys with 600 permissions.")

    # Verify authorized_keys count
    stdin, stdout, stderr = client.exec_command("wc -l /root/.ssh/authorized_keys")
    print(f"[VERIFY] Key entries in authorized_keys: {stdout.read().decode('utf-8').strip()}")
    
finally:
    client.close()
