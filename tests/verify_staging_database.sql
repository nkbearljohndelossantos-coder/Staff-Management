-- ==============================================================================
-- NKB MANUFACTURING -- REAL POSTGRESQL STAGING DATABASE VERIFICATION SUITE
-- Executes directly inside nkb_mfg_staging_postgres container via psql
-- ==============================================================================

\echo '================================================================='
\echo ' NKB MANUFACTURING -- EMPIRICAL POSTGRESQL STAGING ASSERTIONS'
\echo '================================================================='
\echo ''

-- 1. Table Count Assertion (Exact 20 Tables)
\echo '--- [Test 1] Schema Table Count (Target: Exactly 20 Tables) ---'
SELECT COUNT(*) AS total_tables,
       CASE WHEN COUNT(*) = 20 THEN 'PASS: Exactly 20 tables exist'
            ELSE 'FAIL: Table count mismatch' END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. System Storage Archive Completeness (Target: 38 keys under Computer B)
\echo '--- [Test 2] System Storage Archive Keys (Target: Exactly 38 Keys) ---'
SELECT COUNT(*) AS total_archived_keys,
       CASE WHEN COUNT(*) = 38 THEN 'PASS: All 38 keys archived under Computer B'
            ELSE 'FAIL: Incomplete raw archive' END AS status
FROM system_storage_archive 
WHERE source_origin = 'Computer B';

-- 3. Archive Compound Primary Key (Target: key_name, source_origin)
\echo '--- [Test 3] Archive Compound Primary Key Isolation ---'
SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS pk_columns,
       CASE WHEN string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) = 'key_name, source_origin'
            THEN 'PASS: Compound PK enforces Computer A and B separation'
            ELSE 'FAIL: Archive primary key incorrect' END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'system_storage_archive' AND tc.constraint_type = 'PRIMARY KEY';

-- 4. Three Retroactive Claims Quarantine (Target: UNPOSTED_RECEIPT_PENDING_APPROVAL)
\echo '--- [Test 4] Quarantine Status of the 3 Retroactive Claims ---'
SELECT receipt_no, total_amount, transaction_type,
       CASE WHEN transaction_type = 'UNPOSTED_RECEIPT_PENDING_APPROVAL' 
            THEN 'PASS: Correctly Quarantined'
            ELSE 'FAIL: Unquarantined' END AS status
FROM canteen_receipts
WHERE receipt_no IN ('RCT-2026-742421', 'RCT-2026-660129', 'RCT-2026-974934')
ORDER BY receipt_no;

-- 5. Vincent Macol Suspected Duplicate Quarantine (Target: POSSIBLE_DUPLICATE_PENDING_REVIEW)
\echo '--- [Test 5] Quarantine Status of Vincent Macol Receipt (RCT-2026-943735) ---'
SELECT receipt_no, total_amount, transaction_type,
       CASE WHEN transaction_type = 'POSSIBLE_DUPLICATE_PENDING_REVIEW'
            THEN 'PASS: Correctly Quarantined Pending Review'
            ELSE 'FAIL: Unquarantined' END AS status
FROM canteen_receipts
WHERE receipt_no = 'RCT-2026-943735';

-- 6. Zero Anomalous Receipts in Deductions Ledger (Target: Exactly 0)
\echo '--- [Test 6] Deductions Ledger Quarantine Leak Check (Target: 0 Records) ---'
SELECT COUNT(*) AS leaked_anomalous_records,
       CASE WHEN COUNT(*) = 0 THEN 'PASS: Zero anomalous receipts posted to ledger'
            ELSE 'FAIL: Unapproved records leaked into ledger' END AS status
FROM canteen_deductions_ledger
WHERE receipt_no IN ('RCT-2026-742421', 'RCT-2026-660129', 'RCT-2026-974934', 'RCT-2026-943735');

-- 7. Deductions Ledger Exact Parity (Target: 1,108 entries | ₱75,134.67)
\echo '--- [Test 7] Deductions Ledger Approved Totals ---'
SELECT COUNT(*) AS total_entries, 
       SUM(amount) AS total_amount,
       CASE WHEN COUNT(*) = 1108 AND SUM(amount) = 75134.67 
            THEN 'PASS: Exactly 1,108 entries totaling ₱75,134.67'
            ELSE 'FAIL: Ledger total mismatch' END AS status
FROM canteen_deductions_ledger;

-- 8. Staff Debt Balances Exact Parity (Target: 74 members | ₱75,134.67)
\echo '--- [Test 8] Staff Member Balances Approved Totals ---'
SELECT COUNT(*) AS total_members,
       SUM(accumulated_debt) AS total_debt,
       CASE WHEN COUNT(*) = 74 AND SUM(accumulated_debt) = 75134.67
            THEN 'PASS: Exactly 74 balances totaling ₱75,134.67 (Zero variance with ledger)'
            ELSE 'FAIL: Balance total mismatch' END AS status
FROM canteen_ledger_balances;

-- 9. Active Ledger Variance Verification (Target: ₱0.0000)
\echo '--- [Test 9] Active Reconciled Ledger Variance ---'
SELECT (SELECT SUM(total_amount) FROM canteen_receipts WHERE LOWER(payment_method) LIKE '%deduction%' AND transaction_type = 'REGULAR_SALE') AS posted_receipts_sum,
       (SELECT SUM(amount) FROM canteen_deductions_ledger) AS ledger_sum,
       ABS((SELECT SUM(total_amount) FROM canteen_receipts WHERE LOWER(payment_method) LIKE '%deduction%' AND transaction_type = 'REGULAR_SALE') - (SELECT SUM(amount) FROM canteen_deductions_ledger)) AS variance,
       CASE WHEN ABS((SELECT SUM(total_amount) FROM canteen_receipts WHERE LOWER(payment_method) LIKE '%deduction%' AND transaction_type = 'REGULAR_SALE') - (SELECT SUM(amount) FROM canteen_deductions_ledger)) = 0.00
            THEN 'PASS: Exactly ₱0.00 active variance'
            ELSE 'FAIL: Variance detected' END AS status;

-- 10. Staff ID Collision Preservation in Conflicts Table
\echo '--- [Test 10] emp-nkbcanteen Collision Staging Check ---'
SELECT conflict_type, status, source_id,
       CASE WHEN conflict_type = 'STAFF_ID_COLLISION' AND status = 'PENDING_MAPPING_APPROVAL'
            THEN 'PASS: Second profile staged in conflicts table pending approved mapping'
            ELSE 'FAIL: Collision not recorded properly' END AS assertion
FROM system_reconciliation_conflicts
WHERE source_id = 'emp-nkbcanteen';

\echo ''
\echo '================================================================='
\echo ' EMPIRICAL VERIFICATION COMPLETE'
\echo '================================================================='
