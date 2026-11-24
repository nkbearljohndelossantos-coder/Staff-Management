# NKB MANUFACTURING — GATE F: VPS CONNECTION DIAGNOSTIC & READ-ONLY INSPECTION REPORT

**Report Reference:** `NKB-GATE-F-VPS-DIAGNOSTIC-V1`  
**Execution Timestamp:** 2026-11-05T16:58:00+08:00  
**Target Host:** `187.77.143.211:22` (Hostname: `srv1931373.hstgr.cloud`)  
**Target Domain:** `m.nkbmanufacturing.com`  
**Mode:** Strictly Read-Only (Zero State Mutation)  
**Status:** **DIAGNOSTIC COMPLETED**

---

## 1. Executive Summary

A comprehensive read-only diagnostic of VPS `187.77.143.211` was performed. Key empirical findings:

1. **Network & SSH Port:** TCP port `22` is open and directly reachable from the workstation.
2. **Root Cause of Initial Workstation SSH Failure:** The workstation's default OpenSSH client attempted key-based authentication using `~/.ssh/id_ed25519` (`SHA256:aVvm1qu3...`). Because this public key is not yet in the VPS `/root/.ssh/authorized_keys`, the server returned `Permission denied (publickey,...)`. Authenticating via approved password succeeded immediately and confirmed healthy SSH operation.
3. **VPS Docker Environment:** Docker Engine `29.7.2` and Docker Compose `v5.5.0` are active. The `root` account has full Docker permissions.
4. **Existing Containers Untouched:** Exactly 11 production containers (`nkb-unified-assets-app`, `nkb_sop_app`, `dcc_app`, `dcc_postgres`, `dcc_redis`, `nkb_client_app`, `nkb_erp_frontend`, `nkb_erp_backend`, `tiktok-affiliate-monitor`, `portainer`, `nkb_erp_mysql`) remain online and undisturbed.
5. **Zero Deployment Resource Conflicts:**
   - Path `/opt/nkb-manufacturing`: Does not exist (100% clean).
   - Containers `nkb_mfg_*`: Do not exist (100% clean).
   - Network `nkb_mfg_net`: Does not exist (100% clean).
   - Proposed ports `39101` and `39102`: Confirmed completely free.
6. **Reverse Proxy:** Active host **Nginx** handles existing production vhosts (`asset`, `dcc`, `my`, `pr`, `sop`, `tma`). No block currently exists for `m.nkbmanufacturing.com`.
7. **DNS Mismatch Detected:** `m.nkbmanufacturing.com` currently resolves to `179.61.189.229` / `191.101.228.219` (Hostinger shared web parking IPs), NOT the VPS IP `187.77.143.211`.

---

## 2. SSH Connectivity Diagnostic

### 2.1 Network Reachability
```text
ComputerName     : 187.77.143.211
RemoteAddress    : 187.77.143.211
RemotePort       : 22
InterfaceAlias   : Ethernet
SourceAddress    : 192.168.254.20
TcpTestSucceeded : True
```

### 2.2 SSH Failure Root Cause Analysis
- **Command Tested:** `ssh -v -o BatchMode=yes root@187.77.143.211`
- **Observed Server Handshake:** OpenSSH 9.9 on AlmaLinux 10.2 accepts `publickey,gssapi-keyex,gssapi-with-mic,password`.
- **Client Key Offered:** `C:\Users\earlj\.ssh\id_ed25519` (`SHA256:aVvm1qu3HTR9ccimogFHBmxCwtlZHWbKNKcXELQIHFo`).
- **Server Response:** Rejected public key; requested password. In `BatchMode=yes`, the non-interactive CLI aborted with:
  ```text
  root@187.77.143.211: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
  ```
- **Password Authentication Verification:** Authenticating with approved credentials succeeded immediately with full root access.

---

## 3. VPS System & Docker Inspection

### 3.1 Host Identity & Capacity
- **Hostname:** `srv1931373.hstgr.cloud`
- **OS Kernel:** `Linux 6.12.0-211.42.1.el10_2.x86_64` (AlmaLinux 10.2 Lavender Lion)
- **CPU / RAM:** 4 vCPUs | 16 GB Total Memory (16,761,118,720 bytes)
- **Docker Version:** `29.7.2` (API 1.55, Go 1.26.5)
- **Docker Compose:** `v5.5.0`
- **Docker Permissions:** Confirmed full root administrative access.

### 3.2 Existing Running Production Containers (11 Active)
| Container Name | Image | Status | Published Ports / Bindings |
|---|---|---|---|
| `nkb-unified-assets-app` | `nkb-unified-assets:latest` | Up 12 days (healthy) | `127.0.0.1:5050->5000/tcp` |
| `nkb_sop_app` | `sop-management-system-sop-app` | Up 2 weeks (healthy) | `127.0.0.1:4050->4000/tcp` |
| `dcc_app` | `dcc-system-dcc-app` | Up 2 weeks | `127.0.0.1:4000->4000/tcp` |
| `dcc_postgres` | `postgres:16-alpine` | Up 2 weeks (healthy) | `5432/tcp` (internal) |
| `dcc_redis` | `redis:7-alpine` | Up 2 weeks (healthy) | `6379/tcp` (internal) |
| `nkb_client_app` | `nkb-client-system-nkb_client` | Up 6 days (healthy) | Internal network |
| `nkb_erp_frontend` | `pr-frontend` | Up 2 weeks | `127.0.0.1:8080->80/tcp` |
| `nkb_erp_backend` | `pr-backend` | Up 2 weeks | `127.0.0.1:5000->5000/tcp` |
| `tiktok-affiliate-monitor` | `tiktok-affiliate-monitor-...` | Up 2 weeks (healthy) | `0.0.0.0:3001->3001/tcp` |
| `portainer` | `portainer/portainer-ce:latest` | Up 2 weeks | `0.0.0.0:9000, 9443` |
| `nkb_erp_mysql` | `mysql:8.0` | Up 2 weeks | `3306/tcp, 33060/tcp` |

### 3.3 Non-Containerized Host Listeners
- **Port 3000:** `node /var/www/N...` (PID 2896103) — Upstream for `my.nkbmanufacturing.com`.
- **Port 3306:** `mariadbd` (PID 935).
- **Port 80 / 443:** Host Nginx master (PID 1298) and workers.

---

## 4. Proposed NKB Deployment Conflict Check

| Proposed Resource | Conflict Status | Live Evidence |
|---|---|---|
| Target directory `/opt/nkb-manufacturing` | **NO CONFLICT** | `ls: cannot access '/opt/nkb-manufacturing': No such file or directory` |
| Compose project `nkb-manufacturing` | **NO CONFLICT** | No conflicting compose stacks |
| Container `nkb_mfg_frontend` | **NO CONFLICT** | Name available |
| Container `nkb_mfg_backend` | **NO CONFLICT** | Name available |
| Container `nkb_mfg_postgres` | **NO CONFLICT** | Name available (isolated on staging/production bridge) |
| Network `nkb_mfg_net` | **NO CONFLICT** | Network name available |
| Host Port `39101` (NKB Frontend) | **FREE / NO CONFLICT** | `ss -tulpn \| grep 39101` returned 0 results |
| Host Port `39102` (NKB Backend) | **FREE / NO CONFLICT** | `ss -tulpn \| grep 39102` returned 0 results |

---

## 5. Reverse Proxy Configuration & Active Routes

Nginx is active as a host systemd service (`/usr/sbin/nginx`).

### Existing Configured Virtual Hosts
| Domain Name | Listen Ports | Upstream Destination |
|---|---|---|
| `asset.nkbmanufacturing.com` | `80` | `http://127.0.0.1:5050` |
| `dcc.nkbmanufacturing.com` | `80` | `http://127.0.0.1:4000` |
| `my.nkbmanufacturing.com` | `80`, `443` (SSL default_server) | `http://127.0.0.1:3000` |
| `pr.nkbmanufacturing.com` | `80` | `http://127.0.0.1:8080` |
| `sop.nkbmanufacturing.com` | `80` | `http://127.0.0.1:4050` |
| `tma.nkbmanufacturing.com` | `80` | `http://127.0.0.1:3001` |
| `187.77.143.211` (Raw IP) | `80`, `443` | `http://127.0.0.1:3000` |

> [!IMPORTANT]
> `m.nkbmanufacturing.com` is **NOT yet present** in Nginx configuration. When deployed, it will need a dedicated server block:
> ```nginx
> server {
>     listen 80;
>     server_name m.nkbmanufacturing.com;
>     location / {
>         proxy_pass http://127.0.0.1:39101;
>     }
>     location /api/ {
>         proxy_pass http://127.0.0.1:39102;
>     }
> }
> ```

---

## 6. DNS Investigation for `m.nkbmanufacturing.com`

Direct DNS query using `Resolve-DnsName`:

```text
Name                      Type   TTL   IPAddress
----                      ----   ---   ---------
m.nkbmanufacturing.com    A      60    179.61.189.229
m.nkbmanufacturing.com    A      60    191.101.228.219
m.nkbmanufacturing.com    AAAA   60    2a02:4780:16:e42d:1ae6:acc:c558:6ea2
m.nkbmanufacturing.com    AAAA   60    2a02:4780:15:386f:fa55:9830:6a37:7c7
```

- **Target VPS IP:** `187.77.143.211`
- **Current DNS Target:** `179.61.189.229` / `191.101.228.219` (Hostinger shared web servers)
- **Comparison:** `my.nkbmanufacturing.com` correctly points to `187.77.143.211`.
- **Finding:** Public traffic to `m.nkbmanufacturing.com` will not reach VPS `187.77.143.211` until the DNS A record is updated in the DNS provider (Hostinger / Cloudflare) to `187.77.143.211`.

---

## 7. Exact Reasons Deployment Cannot Proceed Immediately

1. **DNS A Record Not Pointing to VPS:** `m.nkbmanufacturing.com` resolves to `179.61.189.229` instead of `187.77.143.211`.
2. **Workstation SSH Key Not in `authorized_keys`:** OpenSSH batch scripts cannot run passwordlessly without either passing credentials via automated wrapper or installing the workstation public key.
3. **Operator Approval Required:** Gate F was authorized for read-only diagnostics only. File uploads, directory creation, container launches, and Nginx edits require explicit human authorization.

---

## 8. Safest Next Recommended Actions

Upon operator approval:

1. **Authorize Workstation SSH Key Installation:**
   Append the workstation public key to `/root/.ssh/authorized_keys` on `187.77.143.211`:
   ```text
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIClP1cRmjEpaG5gVueaorF+MqSilfD6K5rhidKS1SBFp earlj@NkbManuf
   ```
   This eliminates password friction and enables reliable, scriptable deployment.
2. **Update DNS A Record:**
   In your domain DNS management console, update `m.nkbmanufacturing.com`:
   - Type: `A`
   - Host / Name: `m`
   - Points to: `187.77.143.211`
   - TTL: `300` (5 minutes)
   - Remove IPv6 (`AAAA`) records if not routed through the VPS.
3. **Proceed to Gate G (Production Staging on VPS):**
   Deploy the isolated Compose stack (`nkb_mfg_frontend` on `39101`, `nkb_mfg_backend` on `39102`, and `nkb_mfg_postgres` on internal network) into `/opt/nkb-manufacturing`.
4. **Configure Nginx Vhost & SSL:**
   Add `/etc/nginx/conf.d/m.nkbmanufacturing.com.conf` and obtain Let's Encrypt SSL certificate once DNS propagates.
