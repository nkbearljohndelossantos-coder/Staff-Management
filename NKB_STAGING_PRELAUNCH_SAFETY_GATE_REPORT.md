# NKB MANUFACTURING — STAGING PRE-LAUNCH SAFETY GATE V1 REPORT
**Document Reference:** `NKB-STAGING-SAFETY-GATE-V1`  
**Execution Context:** Strictly Local Workstation (`Z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main\`)  
**Production Boundary:** Zero VPS Connectivity | Zero SSH Execution | Zero Reverse Proxy / DNS Changes | Zero Production DB Access  
**Investigation Timestamp:** 2026-11-05T08:20:00.000Z  
**Stop Condition Enforced:** Container launch and migration execution are **BLOCKED** pending explicit human operator approval.

---

## EXECUTIVE SUMMARY & STATUS OVERVIEW

Prior to starting any Docker staging container or executing PostgreSQL migrations, an exhaustive pre-launch safety audit of all staging configurations, batch runners, migration logic, and test suites was conducted.

All identified configuration discrepancies (such as generic container/volume names and missing environment credentials) have been resolved. Staging is 100% isolated, port 5433 is verified free, the backup file is write-protected, and all 10 previously reported tests have been classified with technical transparency.

| Audit Domain | Status | Technical Finding & Verification Summary |
| :--- | :---: | :--- |
| **1. File & Schema Inspection** | **`PASSED`** | Inspected 8 core files; verified exact 20 SQL tables and compound PK schema. |
| **2. Staging Docker Isolation** | **`PASSED`** | Dedicated project, container, volume, and bridge network; host binding strictly `127.0.0.1:5433`. |
| **3. Port & Resource Conflict** | **`PASSED`** | Port 5433 confirmed free; zero name or port collision with existing dev stack (`nkb-postgres-dev`, etc.). |
| **4. Migration Engine Implementation**| **`PASSED`** | Backup verified read-only (SHA-256 matched); 4 anomalous receipts quarantined; strict ACID `BEGIN`/`COMMIT`/`ROLLBACK`. |
| **5. Test Quality Review** | **`PASSED`** | Transparently classified 10 tests (8 Source JSON assertions, 2 static code assertions); authored real `psql` test suite. |
| **6. Real Database Assertions** | **`BLOCKED`** | Real in-database assertions prepared in `tests/verify_staging_database.sql`, awaiting container startup. |
| **7. Non-Destructive Rollback Plan** | **`PASSED`** | Non-destructive shutdown verified; strictly prohibits `docker compose down -v`. |

---

## 1. EXACT FILES INSPECTED

The following files were inspected directly on the local workstation:
1. [`docker-compose.staging.yml`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/docker-compose.staging.yml) (Isolated Compose service definition)
2. [`scripts/run_migration_local.bat`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/scripts/run_migration_local.bat) (Local migration batch launcher)
3. [`scripts/migrate_json_to_postgres.cjs`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/scripts/migrate_json_to_postgres.cjs) (Safety Patch V2 migration engine)
4. [`tests/run_tests_local.bat`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/run_tests_local.bat) (Test execution launcher)
5. [`tests/financial_reconciliation_patch.test.cjs`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/financial_reconciliation_patch.test.cjs) (10 Core safety assertions)
6. [`tests/verify_staging_database.sql`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/verify_staging_database.sql) (Direct PostgreSQL in-container verification script)
7. [`tests/verify_staging_database.bat`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/verify_staging_database.bat) (Direct `psql` runner)
8. [`database/schema.sql`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/database/schema.sql) (Exact 20 relational database tables)
9. [`NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json) (Source backup: 2,889,308 bytes)

---

## 2. EXACT DOCKER RESOURCES TO BE CREATED & ISOLATION AUDIT

The staging service definition in [`docker-compose.staging.yml`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/docker-compose.staging.yml) has been aligned to the required names:

```yaml
name: nkb-manufacturing-staging

services:
  nkb_mfg_staging_postgres:
    image: postgres:16-alpine
    container_name: nkb_mfg_staging_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: nkb_scanner_db
      POSTGRES_USER: nkb_user
      POSTGRES_PASSWORD: nkb_staging_password_2026
    ports:
      - "127.0.0.1:5433:5432"
    volumes:
      - nkb_mfg_staging_postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro
    networks:
      - nkb_mfg_staging_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nkb_user -d nkb_scanner_db"]
      interval: 5s
      timeout: 5s
      retries: 5

networks:
  nkb_mfg_staging_net:
    name: nkb_mfg_staging_net
    driver: bridge

volumes:
  nkb_mfg_staging_postgres_data:
    name: nkb_mfg_staging_postgres_data
```

### Verified Resource Allocations:
- **Project Name:** `nkb-manufacturing-staging` (Unique project namespace)
- **Container Name:** `nkb_mfg_staging_postgres` (Unique container identifier)
- **Dedicated Volume:** `nkb_mfg_staging_postgres_data` (Isolated named volume)
- **Dedicated Network:** `nkb_mfg_staging_net` (Isolated bridge network)
- **Host Binding:** `127.0.0.1:5433:5432` (Loopback interface only; zero external or public exposure)
- **Schema Auto-Init:** Mounts `./database/schema.sql` into `/docker-entrypoint-initdb.d/01_schema.sql:ro` (Read-only container mount)

---

## 3. PORT & RESOURCE CONFLICT RESULTS

Empirical inspection was executed on the host system:

### 3.1 Port 5433 Status: **`PASSED`**
- `Get-NetTCPConnection -LocalPort 5433`: Returned 0 active connections.
- `netstat -ano | findstr :5433`: Returned no listeners.
- **Result:** Port 5433 is completely free and available.

### 3.2 Existing Container Collision Check: **`PASSED`**
The host currently runs the following live containers (all 6 hours+ uptime):
- `nkb-postgres-dev` (Port 5432) — **Untouched**
- `nkb-redis-dev` (Port 6379) — **Untouched**
- `nkb-minio-dev` (Port 9000/9001) — **Untouched**
- `nkb_frontend` (Port 80) — **Untouched**
- `nkb_backend` (Port 5000) — **Untouched**
- `nkb_mysql` (Port 3306) — **Untouched**
- **Result:** `nkb_mfg_staging_postgres` has zero name or port overlap with any running container.

### 3.3 Existing Volume Collision Check: **`PASSED`**
Existing Docker volumes on host:
- `docker_pg-dev-data`, `docker_redis-dev-data`, `docker_storage-dev-data`, `nkb_mysql_data`, `nkb_projects`, `nkb_projects_data`
- **Result:** Dedicated volume `nkb_mfg_staging_postgres_data` does not collide with any existing volume.

### 3.4 Existing Network Collision Check: **`PASSED`**
Existing Docker networks on host:
- `bridge`, `docker_nkb-dev-net`, `host`, `nkb_app_network`, `none`
- **Result:** Dedicated bridge network `nkb_mfg_staging_net` does not collide with any existing network.

---

## 4. MIGRATION ENGINE IMPLEMENTATION FINDINGS

A detailed code review of [`scripts/migrate_json_to_postgres.cjs`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/scripts/migrate_json_to_postgres.cjs) verified:

1. **Physical Backup Write-Protection (`PASSED`):**
   - SHA-256 hash verified: `ce028eef84ebc5f78f492186d931f75c9c00070d3b58b8c55fb07e691f59ae1c`.
   - Windows OS attribute `IsReadOnly` was explicitly confirmed set to `True`. The file cannot be overwritten or altered.
2. **Raw Archive Completeness (`PASSED`):**
   - Iterates through all 38 keys in `backup.data`, inserting both `raw_value` and parsed `json_payload` into `system_storage_archive`.
3. **Compound Primary Key Isolation (`PASSED`):**
   - `PRIMARY KEY (key_name, source_origin)` in [`database/schema.sql`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/database/schema.sql#L344) guarantees Computer A and Computer B backups remain permanently separated without key overwrites.
4. **Anomalous Receipts Quarantine (`PASSED`):**
   - The 3 retroactive claims (`RCT-2026-742421`, `RCT-2026-660129`, `RCT-2026-974934` = ₱255.00) are assigned `transaction_type = 'UNPOSTED_RECEIPT_PENDING_APPROVAL'` and staged in `system_reconciliation_conflicts`.
   - Vincent Macol's ghost receipt (`RCT-2026-943735` = ₱200.00, index 1163) is assigned `transaction_type = 'POSSIBLE_DUPLICATE_PENDING_REVIEW'` and staged in `system_reconciliation_conflicts` with side-by-side comparison to `RCT-2026-233964` / `cded-1792023860287-7`.
   - **Zero Ledger Leakage:** None of the 4 receipts is inserted into `canteen_deductions_ledger` or `canteen_ledger_balances`. An explicit assertion throws a fatal error if any unapproved receipt is detected in the ledger array.
5. **Staff Collision Preservation (`PASSED`):**
   - `emp-nkbcanteen` cashier profile (index 48) is inserted into `staff`; administrator profile (index 50, Super Admin) is staged into `system_reconciliation_conflicts` as `STAFF_ID_COLLISION` without synthetic ID renaming or merging.
6. **Conflict Idempotency (`PASSED`):**
   - Pre-queries `system_reconciliation_conflicts` by `(table_name, source_id, conflict_type)` before inserting, preventing log inflation on re-runs.
7. **Exact Decimal Handling (`PASSED`):**
   - PostgreSQL schema uses `NUMERIC(14,2)` across all monetary fields.
   - Values are explicitly formatted via `.toFixed(2)` strings prior to SQL parameter binding.
   - PostgreSQL native `SUM()` aggregates are used for in-database parity checks.
8. **Strict Transaction Boundary & Rollback (`PASSED`):**
   - `await client.query('BEGIN');` wraps all relational inserts.
   - `catch (err)` executes `await client.query('ROLLBACK');` and re-throws `throw err;`, ensuring no partial writes are committed on failure.

---

## 5. TEST QUALITY REVIEW & CLASSIFICATION

A critical evaluation was conducted on the 10 tests reported in [`tests/financial_reconciliation_patch.test.cjs`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/financial_reconciliation_patch.test.cjs):

| Test # | Asserted Property | Technical Classification | Integration Scope |
| :---: | :--- | :---: | :--- |
| **Test 1** | All 4 anomalous receipts preserved with payloads & indexes | **Source JSON Assertion** | Validates source backup array structure. |
| **Test 2** | None of the four anomalous receipts posted to ledger | **Source JSON Assertion** | Proves absence in source `nkb_canteen_deductions_ledger`. |
| **Test 3** | Three retroactive claims marked pending approval | **Source JSON Assertion** | Validates `isLateEncoded` flags and classification rules. |
| **Test 4** | Vincent Macol duplicate comparison logic | **Source JSON Assertion** | Compares `RCT-2026-943735` to `RCT-2026-233964` / ledger. |
| **Test 5** | Both `emp-nkbcanteen` profiles preserved | **Source JSON Assertion** | Validates staff array indexes 48 and 50 in backup. |
| **Test 6** | Existing posted ₱200 ledger entry is unique | **Source JSON Assertion** | Validates uniqueness of `cded-1792023860287-7`. |
| **Test 7** | Migration re-run idempotency | **Algorithmic Set Assertion** | Proves 100% uniqueness of PK sets in memory. |
| **Test 8** | Failed migration transaction rollback | **Static Code Assertion** | Verifies presence of `BEGIN`, `COMMIT`, `ROLLBACK` blocks. |
| **Test 9** | Archive completeness across all 38 keys | **Source JSON Assertion** | Confirms all 38 keys and record counts in backup. |
| **Test 10** | Computer A and B archive separation | **Static Code Assertion** | Verifies `PRIMARY KEY (key_name, source_origin)` in schema. |

> [!IMPORTANT]
> **Technical Transparency Note:** The 10 tests in `financial_reconciliation_patch.test.cjs` are **Source JSON and Static Code Assertions**. While they empirically prove backup integrity and migration code logic, they do **not** query a live running PostgreSQL database.

### Remediated Missing Integration Coverage:
To provide true in-database proof once staging starts, [`tests/verify_staging_database.sql`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/verify_staging_database.sql) and [`tests/verify_staging_database.bat`](file:///Z:/HP%20Gaming%20Backup/Staff-Management-main/Staff-Management-main/tests/verify_staging_database.bat) have been created. They execute `psql` directly inside the container to test:
1. Exact 20 base tables in PostgreSQL `information_schema.tables`.
2. Actual 38 rows in `system_storage_archive` under `source_origin = 'Computer B'`.
3. Actual quarantine `transaction_type` in `canteen_receipts`.
4. Verification that `SELECT count(*) FROM canteen_deductions_ledger WHERE receipt_no IN (...)` equals exactly `0`.
5. Exact in-database sums: 1,108 entries totaling ₱75,134.67 and 74 balances totaling ₱75,134.67 (₱0.00 active variance).
6. Actual staging of collision in `system_reconciliation_conflicts`.
7. Direct query recovering Profile 2 of `emp-nkbcanteen` (Administrator, Super Admin) from the raw archive.

---

## 6. SECURITY & DATA-INTEGRITY DEFECTS REMEDIATED

During the audit, three operational defects were identified and immediately remediated prior to launch:

1. **Docker Resource Naming Discrepancies (`FIXED`):**
   - *Defect:* `docker-compose.staging.yml` was missing top-level project name, used container name `nkb_staging_postgres`, volume `nkb_staging_postgres_data`, and had no dedicated network.
   - *Fix:* Updated to project `nkb-manufacturing-staging`, container `nkb_mfg_staging_postgres`, volume `nkb_mfg_staging_postgres_data`, and network `nkb_mfg_staging_net`.
2. **Missing Database Credentials in Batch Runners (`FIXED`):**
   - *Defect:* `scripts/run_migration_local.bat` and `tests/run_tests_local.bat` did not export `DB_PASSWORD=nkb_staging_password_2026`, which would have caused authentication rejections on port 5433.
   - *Fix:* Exported `set DB_PASSWORD=nkb_staging_password_2026` in both batch files and defaulted in `migrate_json_to_postgres.cjs`.
3. **Backup OS Attribute Not Write-Protected (`FIXED`):**
   - *Defect:* The original backup file had Windows attribute `IsReadOnly: False`.
   - *Fix:* Executed `Set-ItemProperty` to lock `IsReadOnly: True`, physically preventing accidental file modification.

---

## 7. PRECISE COMMAND SEQUENCE FOR NEXT PHASE (UPON OPERATOR APPROVAL)

Once human approval is granted, the operator executes the following sequential steps in Windows Command Prompt:

```cmd
cd /d "Z:\HP Gaming Backup\Staff-Management-main\Staff-Management-main"

:: 1. Start the isolated staging container on port 5433 (Gate D)
docker compose -f docker-compose.staging.yml up -d

:: 2. Execute Safety Patch V2 migration engine (Gate E)
scripts\run_migration_local.bat

:: 3. Execute real in-database PostgreSQL verification assertions (Gate F)
tests\verify_staging_database.bat

:: 4. Execute automated test suite runner (Gate F)
tests\run_tests_local.bat
```

---

## 8. NON-DESTRUCTIVE ROLLBACK PLAN

If staging needs to be stopped or reset, the following non-destructive procedures apply:

1. **Stop Staging Service (Preserving All Data & Containers):**
   ```cmd
   docker compose -f docker-compose.staging.yml stop
   ```
2. **Tear Down Staging Container & Network (Preserving Staging Volume):**
   ```cmd
   docker compose -f docker-compose.staging.yml down
   ```
3. **Strict Prohibition:**
   - **NEVER** run `docker compose down -v`.
   - **NEVER** run `docker system prune` or `docker volume prune`.
   - Staging volume `nkb_mfg_staging_postgres_data` and all existing dev volumes (`docker_pg-dev-data`, etc.) are permanent.

---

## 9. STOP CONDITION & APPROVAL GATE

All pre-launch checks have completed with **`PASSED`** status across isolation, port binding, and code integrity. 

In strict adherence to the safety gate instructions, **no containers have been started, no schema applied, and no migrations executed.**

The system is fully staged and waiting for explicit operator approval to proceed.
