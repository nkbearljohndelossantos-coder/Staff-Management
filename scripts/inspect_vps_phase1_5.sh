#!/usr/bin/env bash
# ==============================================================================
# NKB MANUFACTURING SYSTEM -- PHASE 1.5 READ-ONLY VERIFICATION SCRIPT (REV 2)
# Target: 187.77.143.211 (root)
# Safety: Strictly Non-Invasive & Read-Only (Zero State Mutation)
# Secret Protection: Strict Whitelist Extraction (No Blacklist Reliance)
# ==============================================================================

set -e

echo "=== [1/5] NGINX INCLUDE DIRECTIVES, VIRTUAL HOSTS & UPSTREAM MAPPINGS ==="
if [ -d /etc/nginx ]; then
    echo "--- Active Nginx Include Directives in /etc/nginx/nginx.conf ---"
    awk '/^[[:space:]]*include[[:space:]]+/ { gsub(/^[[:space:]]+/, "  "); print }' /etc/nginx/nginx.conf 2>/dev/null || true

    echo -e "\n--- Discovered Nginx Configuration Files ---"
    find /etc/nginx/ -maxdepth 3 -name "*.conf" 2>/dev/null || true

    echo -e "\n--- Whitelisted Routing Directives by Configuration File ---"
    # Strict whitelist extraction: captures ONLY listen, server_name, proxy_pass, root, location.
    # Excludes all certificate keys, credentials, headers, and sensitive directives by design.
    for conf in $(find /etc/nginx/ -maxdepth 3 -name "*.conf" 2>/dev/null | sort); do
        echo ">>> File: $conf"
        awk '
            /^[[:space:]]*(listen|server_name|proxy_pass|root)[[:space:]]+/ {
                gsub(/^[[:space:]]+/, "  ");
                print
            }
        ' "$conf" 2>/dev/null || true
    done
else
    echo "Directory /etc/nginx not found on host."
fi

echo -e "\n=== [2/5] PORT 3000 PROCESS METADATA & WORKING DIRECTORY (NON-SENSITIVE) ==="
# Locate PID listening on port 3000 without dumping CLI arguments
P3000_PID=$(ss -tlpn 'sport = :3000' 2>/dev/null | grep -o 'pid=[0-9]*' | head -n 1 | cut -d= -f2 || true)

if [ -n "$P3000_PID" ] && [ -d "/proc/$P3000_PID" ]; then
    echo "--- Process Ownership (Excluding CLI Arguments & Environment) ---"
    ps -o pid,user,group,comm,stat -p "$P3000_PID" 2>/dev/null || true

    echo "--- Working Directory (/proc/$P3000_PID/cwd) ---"
    P3000_CWD=$(readlink -f "/proc/$P3000_PID/cwd" 2>/dev/null || true)
    echo "  CWD: $P3000_CWD"

    if [ -n "$P3000_CWD" ] && [ -f "$P3000_CWD/package.json" ]; then
        echo "--- Package Identity in CWD (name, version, description only) ---"
        awk '
            /^[[:space:]]*"(name|version|description)"[[:space:]]*:/ {
                gsub(/^[[:space:]]+/, "  ");
                print
            }
        ' "$P3000_CWD/package.json" 2>/dev/null || true
    fi
else
    echo "Port 3000 listener PID could not be determined or process not active."
fi

echo -e "\n=== [3/5] MARIADB PORT 3306 SERVICE OWNERSHIP & DISK METADATA ==="
echo "--- Process Table (Binary & Ownership Only) ---"
ps -o pid,user,comm,stat -C mariadbd,mysqld 2>/dev/null || ps aux | grep -E "mariadb|mysqld" | awk '{print $1, $2, $11}' | grep -v grep || true

echo -e "\n--- Systemd Service Status Summary ---"
systemctl is-active mariadb 2>/dev/null && echo "  mariadb service: active" || echo "  mariadb service: inactive/not found"
systemctl is-enabled mariadb 2>/dev/null && echo "  mariadb boot status: enabled" || echo "  mariadb boot status: disabled/not found"

echo -e "\n--- Database Schema Directory Names on Disk (/var/lib/mysql) ---"
# Strictly lists directory names in /var/lib/mysql. Zero queries, zero database connections.
if [ -d /var/lib/mysql ]; then
    ls -d /var/lib/mysql/*/ 2>/dev/null | awk -F'/' '{print $(NF-1)}' | grep -vE "mysql|performance_schema|information_schema|sys" || echo "No custom database directories found in /var/lib/mysql"
else
    echo "/var/lib/mysql directory not found."
fi

echo -e "\n--- MariaDB Configuration Files (Network Bindings Whitelist) ---"
for cnf in /etc/my.cnf /etc/my.cnf.d/*.cnf; do
    if [ -f "$cnf" ]; then
        echo ">>> Config: $cnf"
        awk '
            /^[[:space:]]*(bind-address|port|skip-networking|socket|datadir)[[:space:]]*=/ {
                gsub(/^[[:space:]]+/, "  ");
                print
            }
        ' "$cnf" 2>/dev/null || true
    fi
done

echo -e "\n=== [4/5] HOST FIREWALL DETAIL & ACTIVE SECURITY AGENTS ==="
echo "--- iptables Filter Rules Summary (Counters & Targets) ---"
iptables -L -n -v 2>/dev/null | head -n 45 || true

echo -e "\n--- Active Host Security & Agent Services ---"
systemctl list-units --type=service --state=running 2>/dev/null | grep -iE "firewall|shield|monarx|hostinger|cloud" || echo "No third-party security agent services found."

echo -e "\n=== [5/5] NKB ISOLATION DIRECTORY, DOCKER & PORT POINT-IN-TIME CHECK ==="
echo "--- Target Path Validation (/opt/nkb-manufacturing) ---"
if [ -d /opt/nkb-manufacturing ]; then
    echo "WARNING: /opt/nkb-manufacturing ALREADY EXISTS!"
    ls -la /opt/nkb-manufacturing 2>/dev/null || true
else
    echo "CONFIRMED: /opt/nkb-manufacturing does not exist (Clean deployment directory)."
fi

echo -e "\n--- Active Docker Containers Status ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "docker ps unavailable"

echo -e "\n--- Rechecking Proposed Ports 39101 and 39102 ---"
if ss -tulnp 2>/dev/null | grep -E ":(39101|39102)\b"; then
    echo "WARNING: Port 39101 or 39102 is currently in use!"
else
    echo "CONFIRMED: Ports 39101 and 39102 remain completely VACANT on host."
fi

echo -e "\n=== PHASE 1.5 READ-ONLY VERIFICATION COMPLETE ==="
