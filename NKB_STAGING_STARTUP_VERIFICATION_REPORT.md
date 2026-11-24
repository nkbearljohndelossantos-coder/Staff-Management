# NKB MANUFACTURING — ISOLATED STAGING CONTAINER STARTUP VERIFICATION REPORT

**Report Reference:** `NKB-STAGING-STARTUP-VERIF-V1`  
**Execution Timestamp:** 2026-11-05T16:33:45+08:00  
**Execution Scope:** Local Workstation Only  
**Authorization Gate:** Gate D (Limited Staging Startup Authorization)  
**Status:** **PASSED / VERIFIED**

---

## 1. Executive Summary

Under the explicit limited authorization for **Gate D**, the dedicated staging container `nkb_mfg_staging_postgres` was started using Docker Compose. All operational and safety constraints have been rigorously enforced:

1. **Zero External Access:** Strictly local workstation execution. Zero VPS connectivity, zero SSH, zero DNS or reverse proxy modifications.
2. **Strict Loopback Binding:** Bound exclusively to `127.0.0.1:5433`. Not bound to public interfaces or `0.0.0.0`.
3. **Dedicated Staging Isolation:** Created on dedicated project `nkb-manufacturing-staging`, container `nkb_mfg_staging_postgres`, dedicated volume `nkb_mfg_staging_postgres_data`, and dedicated network `nkb_mfg_staging_net`.
4. **Existing Resource Integrity:** All 6 existing development containers (`nkb-postgres-dev`, `nkb-redis-dev`, `nkb-minio-dev`, `nkb_frontend`, `nkb_backend`, `nkb_mysql`) remain online and completely untouched.
5. **Initial Schema Landed (0 Rows):** First-time schema initialization succeeded. Exactly 20 tables exist with 0 rows.
6. **Stop Condition Enforced:** No data migration, no financial imports, and no data mutations were executed.

---

## 2. Container Status & PostgreSQL Health

### 2.1 Container State Verification
```
Container Name: nkb_mfg_staging_postgres
Container ID:   572cdbf17a8f
Image:          postgres:16-alpine
State:          running
PID:            69541
ExitCode:       0
Health Status:  healthy
Uptime:         Up (healthy)
Restart Policy: "no"
```

### 2.2 Healthcheck Log Evidence
Docker daemon internal healthcheck (`CMD-SHELL pg_isready -U nkb_user -d nkb_scanner_db`):
```text
/var/run/postgresql:5432 - accepting connections (ExitCode: 0)
FailingStreak: 0
Status: healthy
```

---

## 3. Host Port Binding Verification

The staging PostgreSQL listener is bound strictly to loopback IP `127.0.0.1` on port `5433`.

### 3.1 Docker Port Mapping Inspection
```json
{
  "5432/tcp": [
    {
      "HostIp": "127.0.0.1",
      "HostPort": "5433"
    }
  ]
}
```

### 3.2 Host TCP Listener Verification (`Get-NetTCPConnection`)
```text
LocalAddress    LocalPort    State     OwningProcess
------------    ---------    -----     -------------
127.0.0.1       5433         Listen    7788
```

---

## 4. Dedicated Volume & Network Verification

### 4.1 Storage Volume
```text
Volume Name: nkb_mfg_staging_postgres_data
Driver:      local
Mount Path:  /var/lib/docker/volumes/nkb_mfg_staging_postgres_data/_data -> /var/lib/postgresql/data
Mode:        rw
```

### 4.2 Network Isolation
```text
Network Name: nkb_mfg_staging_net
Driver:       bridge
Network ID:   aa1e4b29a5194c98ab8d78953b6d8e8013ed3e0b3319dc27daabd3fcd78b43b3
Gateway:      172.20.0.1
Container IP: 172.20.0.2
Scope:        local
```

---

## 5. First-Time Schema Initialization: 20 Tables (0 Rows)

All 20 tables defined in `database/schema.sql` were created during first-time initialization. An audit of row counts confirms that no data has been inserted:

| # | Table Name | Status | Row Count |
|---|---|---|---|
| 1 | `canteen_categories` | Created | 0 |
| 2 | `canteen_deductions_ledger` | Created | 0 |
| 3 | `canteen_drawer_sessions` | Created | 0 |
| 4 | `canteen_drawer_transactions` | Created | 0 |
| 5 | `canteen_gate_passes` | Created | 0 |
| 6 | `canteen_inventory` | Created | 0 |
| 7 | `canteen_ledger_balances` | Created | 0 |
| 8 | `canteen_receipt_items` | Created | 0 |
| 9 | `canteen_receipts` | Created | 0 |
| 10 | `canteen_sales_invoice_items` | Created | 0 |
| 11 | `canteen_sales_invoices` | Created | 0 |
| 12 | `canteen_void_logs` | Created | 0 |
| 13 | `departments` | Created | 0 |
| 14 | `mfg_products` | Created | 0 |
| 15 | `positions` | Created | 0 |
| 16 | `staff` | Created | 0 |
| 17 | `system_audit_trail` | Created | 0 |
| 18 | `system_notifications` | Created | 0 |
| 19 | `system_reconciliation_conflicts` | Created | 0 |
| 20 | `system_storage_archive` | Created | 0 |

**Total Tables:** 20  
**Total Rows Across All Tables:** 0  
**Verification Result:** Clean, unpolluted staging schema ready for migration upon authorization.

---

## 6. Development Resource Isolation Audit

Empirical verification confirms that all pre-existing development resources continue to run without interruption:

### 6.1 Container Status
| Container Name | Image | Status | Ports |
|---|---|---|---|
| `nkb_mfg_staging_postgres` | `postgres:16-alpine` | Up (healthy) | `127.0.0.1:5433->5432/tcp` |
| `nkb-postgres-dev` | `postgres:16.3-alpine` | Up 6 hours (healthy) | `0.0.0.0:5432->5432/tcp` |
| `nkb-redis-dev` | `redis:7.2.5-alpine` | Up 6 hours (healthy) | `0.0.0.0:6379->6379/tcp` |
| `nkb-minio-dev` | `minio/...` | Up 6 hours (healthy) | `0.0.0.0:9000->9000/tcp, 127.0.0.1:9001->9001/tcp` |
| `nkb_frontend` | `projecttracker-frontend` | Up 6 hours (healthy) | `0.0.0.0:80->80/tcp` |
| `nkb_backend` | `projecttracker-backend` | Up 6 hours | `5000/tcp` |
| `nkb_mysql` | `mysql:8.0` | Up 6 hours (healthy) | `3306/tcp, 33060/tcp` |

### 6.2 Volume Isolation Check
- `docker_pg-dev-data`: Untouched
- `docker_redis-dev-data`: Untouched
- `docker_storage-dev-data`: Untouched
- `nkb_mysql_data`: Untouched
- `nkb_projects`: Untouched
- `nkb_projects_data`: Untouched
- **`nkb_mfg_staging_postgres_data`**: New dedicated staging volume

### 6.3 Network Isolation Check
- `docker_nkb-dev-net`: Untouched
- `nkb_app_network`: Untouched
- **`nkb_mfg_staging_net`**: New dedicated staging network

---

## 7. Compliance and Stop Condition

```
[STOP CONDITION SATISFIED]
- Container startup: COMPLETED
- PostgreSQL healthcheck: PASSED
- Port 5433 loopback verification: PASSED
- Volume and network isolation: PASSED
- 20 Schema tables verified empty: PASSED
- Zero impact on development containers: PASSED

MIGRATION ENGINE: NOT EXECUTED
FINANCIAL IMPORT: NOT EXECUTED
INTEGRATION TESTS: NOT EXECUTED
DATABASE MUTATIONS: NOT EXECUTED
```

Execution is halted immediately as mandated. The isolated staging database is in an idle, healthy, verified state awaiting explicit human approval for **Gate E (Migration Execution)**.
