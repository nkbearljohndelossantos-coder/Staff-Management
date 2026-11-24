#!/usr/bin/env bash
set -e

echo '================================================================='
echo ' 1. NKB ISOLATED COMPOSE STACK STATUS'
echo '================================================================='
cd /opt/nkb-manufacturing
docker compose ps

echo '================================================================='
echo ' 2. BACKEND API HEALTH CHECK (127.0.0.1:39102/api/health)'
echo '================================================================='
curl -s -w '\nHTTP_STATUS: %{http_code}\n' http://127.0.0.1:39102/api/health

echo '================================================================='
echo ' 3. FRONTEND HTTP HEADER CHECK (127.0.0.1:39101/)'
echo '================================================================='
curl -I -s http://127.0.0.1:39101/ | head -n 5

echo '================================================================='
echo ' 4. DATABASE ROW COUNTS ACROSS 20 TABLES'
echo '================================================================='
TABLES=(
  departments positions staff canteen_categories canteen_inventory
  canteen_sales_invoices canteen_sales_invoice_items canteen_receipts
  canteen_receipt_items canteen_deductions_ledger canteen_ledger_balances
  canteen_drawer_sessions canteen_drawer_transactions canteen_gate_passes
  canteen_void_logs mfg_products system_notifications system_audit_trail
  system_storage_archive system_reconciliation_conflicts
)

printf "%-35s | %-10s\n" "Table Name" "Row Count"
echo "------------------------------------+-----------"
TOTAL=0
for t in "${TABLES[@]}"; do
  CNT=$(docker exec nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -t -c "SELECT count(*) FROM $t;" | tr -d '[:space:]')
  printf "%-35s | %-10s\n" "$t" "$CNT"
  TOTAL=$((TOTAL + CNT))
done
echo "------------------------------------+-----------"
printf "%-35s | %-10s\n" "TOTAL (20 Tables)" "$TOTAL"

echo '================================================================='
echo ' 5. TOTAL ROWS AND FINANCIAL PARITY PROOF'
echo '================================================================='
docker exec nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -t -c "
  SELECT json_build_object(
    'deductions_total', (SELECT COALESCE(SUM(amount), 0.00)::numeric(12,2) FROM canteen_deductions_ledger),
    'posted_receipts_total', (SELECT COALESCE(SUM(total_amount), 0.00)::numeric(12,2) FROM canteen_receipts WHERE LOWER(payment_method) LIKE '%deduction%' AND transaction_type = 'REGULAR_SALE'),
    'staff_balances_total', (SELECT COALESCE(SUM(accumulated_debt), 0.00)::numeric(12,2) FROM canteen_ledger_balances),
    'quarantined_total', (SELECT COALESCE(SUM(total_amount), 0.00)::numeric(12,2) FROM canteen_receipts WHERE transaction_type IN ('UNPOSTED_RECEIPT_PENDING_APPROVAL', 'POSSIBLE_DUPLICATE_PENDING_REVIEW')),
    'quarantined_count', (SELECT count(*) FROM canteen_receipts WHERE transaction_type IN ('UNPOSTED_RECEIPT_PENDING_APPROVAL', 'POSSIBLE_DUPLICATE_PENDING_REVIEW'))
  )::text;
"

echo '================================================================='
echo ' 6. RECONFIRMING ALL 11 PRE-EXISTING CONTAINERS'
echo '================================================================='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -v 'nkb_mfg'

echo '================================================================='
echo ' 7. VERIFYING HOST NGINX UNTOUCHED'
echo '================================================================='
ls -la /etc/nginx/conf.d/
