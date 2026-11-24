import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("187.77.143.211", port=22, username="root", password=os.environ.get("VPS_PASSWORD", ""))
stdin, stdout, stderr = client.exec_command("sshd -T")
lines = [l for l in stdout.read().decode().splitlines() if any(k in l.lower() for k in ["pubkey", "authorized", "strictmodes"])]
print("\n".join(lines))
client.close()
