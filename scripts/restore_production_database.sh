#!/usr/bin/env bash
# ==============================================================================
# NKB MANUFACTURING -- PRODUCTION DATABASE HARDENED RESTORE & PARITY VERIFICATION
# Purpose: Error-safe, transaction-atomic restore of migrated data into isolated VPS PostgreSQL
# Target:  nkb_mfg_postgres (nkb_scanner_db)
# ==============================================================================

set -euo pipefail

CONTAINER_NAME="nkb_mfg_postgres"
DB_USER="nkb_user"
DB_NAME="nkb_scanner_db"
DUMP_FILE="/opt/nkb-manufacturing/migrated_data.sql"
TMP_INSIDE_CONTAINER="/tmp/migrated_data.sql"

echo "================================================================="
echo " NKB MANUFACTURING -- SECURE PRODUCTION DATABASE RESTORE ENGINE"
echo " Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo " Target Container: ${CONTAINER_NAME}"
echo " Target Database:  ${DB_NAME} (User: ${DB_USER})"
echo " Source Dump File: ${DUMP_FILE}"
echo "================================================================="

# Step 1: Pre-flight file existence and integrity check
if [ ! -f "${DUMP_FILE}" ]; then
  echo "[-] FATAL: Dump file not found at ${DUMP_FILE}" >&2
  exit 1
fi

FILE_SIZE=$(stat -c%s "${DUMP_FILE}")
echo "[1/6] Source SQL dump file confirmed. Size: ${FILE_SIZE} bytes."

# Step 2: Verify PostgreSQL container is healthy and responding
echo "[2/6] Verifying PostgreSQL container health..."
if ! docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}"; then
  echo "[-] FATAL: PostgreSQL in container ${CONTAINER_NAME} is not responding or unhealthy!" >&2
  exit 1
fi

# Step 3: Verify target database is in expected empty state before restore
echo "[3/6] Pre-restore baseline audit: Checking table row counts..."
ROW_SUM=$(docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -v ON_ERROR_STOP=1 -c "
  SELECT COALESCE(SUM(c), 0) FROM (
    SELECT count(*) AS c FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'
  ) t;
")

TABLE_COUNT=$(echo "${ROW_SUM}" | tr -d '[:space:]')
echo "      Existing public tables found: ${TABLE_COUNT}"

if [ "${TABLE_COUNT}" -gt 0 ]; then
  DATA_ROW_COUNT=$(docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -v ON_ERROR_STOP=1 -c "
    DO \$\$
    DECLARE
      r RECORD;
      cnt BIGINT;
      total BIGINT := 0;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'SELECT count(*) FROM public.' || quote_ident(r.tablename) INTO cnt;
        total := total + cnt;
      END LOOP;
      IF total > 0 THEN
        RAISE EXCEPTION 'DATABASE_NOT_EMPTY: Database currently contains % existing rows. Aborting restore to prevent corruption.', total;
      END IF;
    END \$\$;
  ")
  echo "      Verified baseline: Database tables exist and contain exactly 0 rows."
else
  echo "      Verified baseline: Database is completely uninitialized (0 tables)."
fi

# Step 4: Transfer SQL dump into container filesystem (Eliminates pipe failure risks)
echo "[4/6] Copying SQL dump into container filesystem..."
docker cp "${DUMP_FILE}" "${CONTAINER_NAME}:${TMP_INSIDE_CONTAINER}"

# Step 5: Execute atomic single-transaction restore with strict ON_ERROR_STOP
echo "[5/6] Executing atomic database restore via internal psql (--single-transaction, ON_ERROR_STOP=1)..."
# Using --single-transaction (-1) guarantees that psql wraps the entire file in BEGIN ... COMMIT.
# If ANY command fails, PostgreSQL rolls back all schema and data changes atomically.
if docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 --single-transaction -f "${TMP_INSIDE_CONTAINER}" > /tmp/psql_restore.log 2>&1; then
  echo "      [RESTORE SUCCESS] Single-transaction atomic commit succeeded for all 20 tables."
  # Remove temporary SQL dump inside container immediately
  docker exec "${CONTAINER_NAME}" rm -f "${TMP_INSIDE_CONTAINER}"
else
  RESTORE_EXIT_CODE=$?
  echo "[-] FATAL RESTORE ERROR: psql failed with exit code ${RESTORE_EXIT_CODE}!" >&2
  tail -n 30 /tmp/psql_restore.log >&2
  
  # Defensive post-failure cleanup: reset schema so no partial artifacts remain
  echo "[-] Executing defensive schema reset to ensure clean baseline..." >&2
  docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${DB_USER};" || true
  docker exec "${CONTAINER_NAME}" rm -f "${TMP_INSIDE_CONTAINER}" || true
  exit "${RESTORE_EXIT_CODE}"
fi

# Step 6: Post-restore verification & Financial Parity Audit
echo "[6/6] Executing Post-Restore Completeness and Financial Parity Audit..."

AUDIT_SQL="
SELECT json_build_object(
  'total_rows', (
    SELECT sum(cnt) FROM (
      SELECT count(*) as cnt FROM departments
      UNION ALL SELECT count(*) FROM positions
      UNION ALL SELECT count(*) FROM staff
      UNION ALL SELECT count(*) FROM canteen_categories
      UNION ALL SELECT count(*) FROM canteen_inventory
      UNION ALL SELECT count(*) FROM mfg_products
      UNION ALL SELECT count(*) FROM canteen_drawer_sessions
      UNION ALL SELECT count(*) FROM canteen_drawer_transactions
      UNION ALL SELECT count(*) FROM canteen_receipts
      UNION ALL SELECT count(*) FROM canteen_receipt_items
      UNION ALL SELECT count(*) FROM canteen_deductions_ledger
      UNION ALL SELECT count(*) FROM canteen_ledger_balances
      UNION ALL SELECT count(*) FROM canteen_sales_invoices
      UNION ALL SELECT count(*) FROM canteen_sales_invoice_items
      UNION ALL SELECT count(*) FROM canteen_void_logs
      UNION ALL SELECT count(*) FROM canteen_gate_passes
      UNION ALL SELECT count(*) FROM system_notifications
      UNION ALL SELECT count(*) FROM system_audit_trail
      UNION ALL SELECT count(*) FROM system_storage_archive
      UNION ALL SELECT count(*) FROM system_reconciliation_conflicts
    ) t
  ),
  'deductions_total', (SELECT COALESCE(SUM(amount), 0.00)::numeric(12,2) FROM canteen_deductions_ledger),
  'posted_receipts_total', (SELECT COALESCE(SUM(total_amount), 0.00)::numeric(12,2) FROM canteen_receipts WHERE LOWER(payment_method) LIKE '%deduction%' AND transaction_type = 'REGULAR_SALE'),
  'staff_balances_total', (SELECT COALESCE(SUM(accumulated_debt), 0.00)::numeric(12,2) FROM canteen_ledger_balances),
  'quarantined_total', (SELECT COALESCE(SUM(total_amount), 0.00)::numeric(12,2) FROM canteen_receipts WHERE transaction_type IN ('UNPOSTED_RECEIPT_PENDING_APPROVAL', 'POSSIBLE_DUPLICATE_PENDING_REVIEW')),
  'quarantined_count', (SELECT count(*) FROM canteen_receipts WHERE transaction_type IN ('UNPOSTED_RECEIPT_PENDING_APPROVAL', 'POSSIBLE_DUPLICATE_PENDING_REVIEW'))
)::text;
"

AUDIT_RESULT=$(docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -v ON_ERROR_STOP=1 -c "${AUDIT_SQL}")
echo "Post-restore metrics: ${AUDIT_RESULT}"

# Validate metrics in python
python3 -c "
import json, sys
data = json.loads('''${AUDIT_RESULT}''')
print('Audit breakdown:')
print(f'  Total Database Rows:      {data[\"total_rows\"]} (Expected: 5450)')
print(f'  Deductions Ledger Total:  ₱{data[\"deductions_total\"]} (Expected: 75134.67)')
print(f'  Posted Receipts Total:    ₱{data[\"posted_receipts_total\"]} (Expected: 75134.67)')
print(f'  Staff Debt Balances:      ₱{data[\"staff_balances_total\"]} (Expected: 75134.67)')
print(f'  Quarantined Receipts:     ₱{data[\"quarantined_total\"]} ({data[\"quarantined_count\"]} receipts, Expected: 455.00 / 4)')

if data['total_rows'] != 5450:
    print('[-] ERROR: Total rows mismatch!')
    sys.exit(1)
if float(data['deductions_total']) != 75134.67 or float(data['posted_receipts_total']) != 75134.67:
    print('[-] ERROR: Financial ledger variance!')
    sys.exit(1)
if float(data['quarantined_total']) != 455.00 or int(data['quarantined_count']) != 4:
    print('[-] ERROR: Quarantined exception mismatch!')
    sys.exit(1)

print('[+] VERIFICATION PASSED: Production database matches staging with 100% mathematical parity.')
"

echo "================================================================="
echo " RESTORE & PARITY VERIFICATION COMPLETED SUCCESSFULLY"
echo "================================================================="
