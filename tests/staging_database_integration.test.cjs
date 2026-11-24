/**
 * ==============================================================================
 * NKB MANUFACTURING SYSTEM -- STAGING POSTGRESQL REAL INTEGRATION TEST SUITE
 * Test File: tests/staging_database_integration.test.cjs
 * Target Database: PostgreSQL 16 on 127.0.0.1:5433 (nkb_mfg_staging_postgres)
 * Purpose: Real database assertions verifying table counts, archive completeness,
 *          quarantine isolation, emp-nkbcanteen profile recovery, and re-run idempotency.
 * ==============================================================================
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  database: process.env.DB_NAME || 'nkb_scanner_db',
  user: process.env.DB_USER || 'nkb_user',
  password: process.env.DB_PASSWORD || 'nkb_staging_password_2026',
  connectionTimeoutMillis: 3000,
});

async function runStagingDbTests() {
  console.log('=================================================================');
  console.log(' NKB MANUFACTURING -- REAL STAGING POSTGRESQL INTEGRATION TESTS');
  console.log(` Target DB: ${process.env.DB_NAME || 'nkb_scanner_db'} @ ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5433'}`);
  console.log('=================================================================\n');

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error(`[BLOCKED] Staging PostgreSQL container is not running or unreachable on port 5433: ${err.message}`);
    console.error('Start staging container via: docker compose -f docker-compose.staging.yml up -d');
    process.exit(2); // Exit code 2 = BLOCKED on missing running container
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, num, desc) {
    if (condition) {
      console.log(`  [PASS] Integration Test ${String(num).padStart(2)}: ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] Integration Test ${String(num).padStart(2)}: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Verify exact 20 tables exist
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tableNames = tablesRes.rows.map(r => r.table_name);
    assert(tableNames.length === 20, 1, `Exact 20 PostgreSQL schema tables confirmed (Actual: ${tableNames.length})`);

    // 2. Verify all 38 raw keys in system_storage_archive
    const archiveRes = await client.query(`
      SELECT COUNT(*) AS count FROM system_storage_archive WHERE source_origin = 'Computer B'
    `);
    const archiveCount = parseInt(archiveRes.rows[0].count, 10);
    assert(archiveCount === 38, 2, `All 38 raw keys archived under Computer B (Actual: ${archiveCount})`);

    // 3. Verify the 4 anomalous receipts in canteen_receipts are quarantined
    const unpostedClaimsRes = await client.query(`
      SELECT receipt_no, total_amount, transaction_type 
      FROM canteen_receipts 
      WHERE receipt_no IN ('RCT-2026-742421', 'RCT-2026-660129', 'RCT-2026-974934')
    `);
    const retroAllQuarantined = unpostedClaimsRes.rows.every(r => r.transaction_type === 'UNPOSTED_RECEIPT_PENDING_APPROVAL');
    assert(unpostedClaimsRes.rows.length === 3 && retroAllQuarantined, 3, 'Three retroactive claims present in DB with transaction_type = UNPOSTED_RECEIPT_PENDING_APPROVAL');

    // 4. Verify Vincent Macol duplicate quarantine in DB
    const macolDupRes = await client.query(`
      SELECT receipt_no, total_amount, transaction_type 
      FROM canteen_receipts 
      WHERE receipt_no = 'RCT-2026-943735'
    `);
    const macolQuarantined = macolDupRes.rows.length === 1 && macolDupRes.rows[0].transaction_type === 'POSSIBLE_DUPLICATE_PENDING_REVIEW';
    assert(macolQuarantined, 4, 'Vincent Macol receipt RCT-2026-943735 present in DB with transaction_type = POSSIBLE_DUPLICATE_PENDING_REVIEW');

    // 5. Verify deductions ledger contains ZERO anomalous receipts
    const ledgerPollutionRes = await client.query(`
      SELECT COUNT(*) AS count 
      FROM canteen_deductions_ledger 
      WHERE receipt_no IN ('RCT-2026-742421', 'RCT-2026-660129', 'RCT-2026-974934', 'RCT-2026-943735')
    `);
    assert(parseInt(ledgerPollutionRes.rows[0].count, 10) === 0, 5, 'Deductions ledger contains ZERO anomalous receipts (0 unapproved debt posted)');

    // 6. Verify posted ledger total and active balances in DB
    const dbLedgerSumRes = await client.query('SELECT COALESCE(SUM(amount), 0.00) AS total, COUNT(*) AS count FROM canteen_deductions_ledger');
    const dbBalanceSumRes = await client.query('SELECT COALESCE(SUM(accumulated_debt), 0.00) AS total, COUNT(*) AS count FROM canteen_ledger_balances');
    const ledgerTotal = Number(dbLedgerSumRes.rows[0].total);
    const balanceTotal = Number(dbBalanceSumRes.rows[0].total);
    const ledgerCount = parseInt(dbLedgerSumRes.rows[0].count, 10);
    const balanceCount = parseInt(dbBalanceSumRes.rows[0].count, 10);

    assert(ledgerCount === 1108 && Math.abs(ledgerTotal - 75134.67) < 0.01, 6, `Deductions ledger matches exact approved total: ₱${ledgerTotal.toFixed(2)} (1,108 entries)`);
    assert(balanceCount === 74 && Math.abs(balanceTotal - 75134.67) < 0.01, 7, `Staff member debt balances match exact ledger sum: ₱${balanceTotal.toFixed(2)} (74 balances)`);

    // 8. Verify system_reconciliation_conflicts entries
    const conflictsRes = await client.query(`
      SELECT conflict_type, COUNT(*) AS count 
      FROM system_reconciliation_conflicts 
      GROUP BY conflict_type
    `);
    const conflictTypes = conflictsRes.rows.reduce((acc, r) => ({ ...acc, [r.conflict_type]: parseInt(r.count, 10) }), {});
    const conflictsExpected = (
      conflictTypes['UNPOSTED_RECEIPT_PENDING_APPROVAL'] === 3 &&
      conflictTypes['POSSIBLE_DUPLICATE_PENDING_REVIEW'] === 1 &&
      conflictTypes['STAFF_ID_COLLISION'] >= 1
    );
    assert(conflictsExpected, 8, `Quarantine conflicts staged in system_reconciliation_conflicts (Retroactive=3, Duplicate=1, Staff Collision>=1)`);

    // 9. Verify recoverability of second emp-nkbcanteen profile from raw archive
    const rawStaffRes = await client.query(`
      SELECT json_payload 
      FROM system_storage_archive 
      WHERE key_name = 'nkb_hr_staff' AND source_origin = 'Computer B'
    `);
    const rawStaffList = rawStaffRes.rows[0].json_payload || [];
    const empCanteenProfiles = rawStaffList.filter(s => s.id === 'emp-nkbcanteen');
    const profile2Recoverable = (
      empCanteenProfiles.length === 2 &&
      empCanteenProfiles[0].positionTitle === 'Canteen POS Terminal' &&
      empCanteenProfiles[1].positionTitle === 'Canteen Administrator & Manager' &&
      empCanteenProfiles[1].role === 'canteen'
    );
    assert(profile2Recoverable, 9, 'Second emp-nkbcanteen profile (Administrator & Manager) fully recoverable from raw archive');

    // 10. Verify compound PK separation for Computer A vs Computer B
    const pkRes = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'system_storage_archive' AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY kcu.ordinal_position
    `);
    const pkCols = pkRes.rows.map(r => r.column_name);
    const compoundPkConfirmed = pkCols.length === 2 && pkCols.includes('key_name') && pkCols.includes('source_origin');
    assert(compoundPkConfirmed, 10, 'Compound primary key (key_name, source_origin) verified in PostgreSQL catalogs');

    console.log('\n=================================================================');
    console.log(` REAL DATABASE TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('[ERROR IN INTEGRATION TESTS]', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runStagingDbTests();
}

module.exports = { runStagingDbTests };
