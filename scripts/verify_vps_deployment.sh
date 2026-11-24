#!/bin/bash
set -e

HOST="127.0.0.1"
DOMAIN="m.nkbmanufacturing.com"

echo "=== 1. LOOPBACK HEALTH CHECK ==="
curl -sS -i -H "Host: $DOMAIN" "http://$HOST/api/health"

echo ""
echo "=== 2. FRONTEND HTML TITLE CHECK ==="
curl -sS -H "Host: $DOMAIN" "http://$HOST/" | grep -o '<title>.*</title>'

echo ""
echo "=== 3. EMAIL REJECTION CHECK ==="
curl -sS -i -H "Host: $DOMAIN" -H "Content-Type: application/json" \
  -d '{"identifier":"admin@nkbmanufacturing.com","password":"test"}' \
  "http://$HOST/api/auth/login" | head -n 15

echo ""
echo "=== 4. BARCODE WITHOUT PIN REJECTION CHECK ==="
curl -sS -i -H "Host: $DOMAIN" -H "Content-Type: application/json" \
  -d '{"barcode":"NKB-EMP-001"}' \
  "http://$HOST/api/auth/barcode" | head -n 15

echo ""
echo "=== 5. CHECK RECORD COUNTS ==="
docker exec nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -c "
SELECT 'departments' as tbl, count(*) FROM departments
UNION ALL SELECT 'positions', count(*) FROM positions
UNION ALL SELECT 'staff', count(*) FROM staff
UNION ALL SELECT 'canteen_inventory', count(*) FROM canteen_inventory
UNION ALL SELECT 'canteen_sales_invoices', count(*) FROM canteen_sales_invoices
UNION ALL SELECT 'canteen_sales_invoice_items', count(*) FROM canteen_sales_invoice_items
UNION ALL SELECT 'canteen_receipts', count(*) FROM canteen_receipts
UNION ALL SELECT 'canteen_receipt_items', count(*) FROM canteen_receipt_items
UNION ALL SELECT 'canteen_deductions_ledger', count(*) FROM canteen_deductions_ledger
UNION ALL SELECT 'canteen_ledger_balances', count(*) FROM canteen_ledger_balances
UNION ALL SELECT 'canteen_drawer_transactions', count(*) FROM canteen_drawer_transactions;
"

echo ""
echo "=== 6. CHECK FINANCIAL TOTALS ==="
docker exec nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -c "
SELECT 'canteen_deductions_ledger_sum' as metric, SUM(amount)::numeric(12,2) FROM canteen_deductions_ledger
UNION ALL
SELECT 'canteen_ledger_balances_sum', SUM(accumulated_debt)::numeric(12,2) FROM canteen_ledger_balances
UNION ALL
SELECT 'canteen_drawer_cash_sum', SUM(amount)::numeric(12,2) FROM canteen_drawer_transactions;
"

echo ""
echo "=== 7. CHECK QUARANTINED RECEIPTS ==="
docker exec nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -c "
SELECT transaction_type, count(*), SUM(total_amount)::numeric(12,2)
FROM canteen_receipts
GROUP BY transaction_type;
"
