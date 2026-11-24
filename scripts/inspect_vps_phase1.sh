#!/usr/bin/env bash
# ==============================================================================
# NKB MANUFACTURING SYSTEM — VPS PHASE 1 READ-ONLY INSPECTION SCRIPT
# Target: 187.77.143.211 (root)
# Safety: Strictly Read-Only (Zero Mutation)
# ==============================================================================

set -e

echo "=== [1/10] OS & KERNEL INFORMATION ==="
uname -a
if [ -f /etc/os-release ]; then
    cat /etc/os-release
fi

echo -e "\n=== [2/10] CPU & HARDWARE SPECIFICATIONS ==="
echo "CPU Architecture: $(uname -m)"
echo "CPU Cores: $(nproc)"
lscpu | grep -E "Model name|CPU\(s\):|Thread\(s\) per core|Core\(s\) per socket|Socket\(s\):|BogoMIPS" || true

echo -e "\n=== [3/10] RAM & MEMORY UTILIZATION ==="
free -m -h
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree" || true

echo -e "\n=== [4/10] DISK CAPACITY & PARTITIONS ==="
df -h
echo "--- Block Devices ---"
lsblk || true

echo -e "\n=== [5/10] DOCKER & DOCKER COMPOSE VERSIONS ==="
if command -v docker &> /dev/null; then
    docker --version
    docker info 2>/dev/null | grep -E "Server Version|Storage Driver|Logging Driver|Cgroup Driver|Kernel Version|Operating System|OSType|Architecture|CPUs|Total Memory|Docker Root Dir" || true
else
    echo "WARNING: docker binary not found in PATH."
fi

if docker compose version &> /dev/null; then
    docker compose version
elif command -v docker-compose &> /dev/null; then
    docker-compose --version
else
    echo "WARNING: docker compose / docker-compose not found."
fi

echo -e "\n=== [6/10] EXISTING DOCKER CONTAINERS ==="
if command -v docker &> /dev/null; then
    docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
fi

echo -e "\n=== [7/10] EXISTING DOCKER NETWORKS ==="
if command -v docker &> /dev/null; then
    docker network ls
fi

echo -e "\n=== [8/10] EXISTING DOCKER VOLUMES ==="
if command -v docker &> /dev/null; then
    docker volume ls
fi

echo -e "\n=== [9/10] NETWORK LISTENING PORTS & FIREWALL ==="
echo "--- Listening TCP/UDP Ports ---"
ss -tulnp 2>/dev/null || netstat -tulnp 2>/dev/null || lsof -i -P -n | grep LISTEN || true

echo "--- Dedicated Port Check for NKB (39101 & 39102) ---"
if ss -tulnp 2>/dev/null | grep -E ":(39101|39102)\b"; then
    echo "WARNING: Port 39101 or 39102 is already in use!"
else
    echo "CONFIRMED: Ports 39101 and 39102 are completely FREE and AVAILABLE on host."
fi

echo "--- Firewall (UFW) ---"
if command -v ufw &> /dev/null; then
    ufw status verbose || true
fi

echo "--- Firewall (iptables summary) ---"
iptables -S 2>/dev/null | head -n 30 || true

echo -e "\n=== [10/10] DOCKER MANAGER & REVERSE PROXY DETECTION ==="
echo "Checking for Portainer..."
docker ps -a --filter "name=portainer" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true

echo "Checking for Coolify..."
docker ps -a --filter "name=coolify" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
if [ -d /data/coolify ]; then
    echo "Coolify directory found at /data/coolify"
fi

echo "Checking for 1Panel..."
docker ps -a --filter "name=1panel" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true

echo "Checking for Nginx Proxy Manager / Traefik / Caddy / Reverse Proxies..."
docker ps -a --filter "name=nginx" --filter "name=proxy" --filter "name=traefik" --filter "name=caddy" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true

echo "--- Web Server / Proxy Processes ---"
ps aux | grep -E "nginx|caddy|traefik|apache2|httpd" | grep -v grep || echo "No standalone web proxy process running on host OS."

echo "--- SSL Certificate Inventory (Directory Listing Only) ---"
if [ -d /etc/letsencrypt/live ]; then
    echo "Let's Encrypt live certificates directory:"
    ls -la /etc/letsencrypt/live || true
else
    echo "/etc/letsencrypt/live not found or empty on host OS."
fi

echo -e "\n=== INSPECTION COMPLETED SUCCESSFULLY ==="
