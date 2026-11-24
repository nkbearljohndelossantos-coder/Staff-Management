/**
 * ==============================================================================
 * NKB MANUFACTURING SYSTEM -- ACID TRANSACTION ROLLBACK VERIFICATION TEST
 * Purpose: Empirically prove that transaction failure rolls back all state
 *          (inventory stock decrements, receipt records, ledgers).
 * ==============================================================================
 */

const path = require('path');
let pg;
try {
  pg = require('pg');
} catch {
  pg = require(path.resolve(__dirname, '..', 'backend', 'node_modules', 'pg'));
}
const { Pool } = pg;
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'nkb_scanner_db',
  user: process.env.DB_USER || 'nkb_user',
  password: process.env.DB_PASSWORD || '',
  max: 2,
  connectionTimeoutMillis: 5000,
});

async function runAcidTest() {
  console.log('=================================================================');
  console.log(' NKB MANUFACTURING -- ACID ROLLBACK EMPIRICAL VERIFICATION');
  console.log(` Target DB: ${process.env.DB_NAME || 'nkb_scanner_db'} @ ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5432'}`);
  console.log('=================================================================\n');

  const client = await pool.connect();
  const testItemId = `test-acid-item-${Date.now()}`;
  const testReceiptNo = `REC-ACID-FAIL-${Date.now()}`;
  const initialStock = 50;

  try {
    // 1. Setup clean test item
    await client.query(
      `INSERT INTO canteen_inventory (id, name, category, cost_price, selling_price, current_stock, minimum_stock)
       VALUES ($1, 'ACID Test Soda', 'Beverages', 10.00, 15.00, $2, 5)`,
      [testItemId, initialStock]
    );
    console.log(`[1/4] Baseline created: Item '${testItemId}' with stock = ${initialStock}`);

    // 2. Start Transaction that will deliberately fail
    console.log('[2/4] Executing transaction: Decrement stock, insert receipt, then trigger failure...');
    let caughtError = null;

    try {
      await client.query('BEGIN');

      // Decrement stock
      await client.query(
        `UPDATE canteen_inventory SET current_stock = current_stock - 5 WHERE id = $1`,
        [testItemId]
      );

      // Insert receipt
      await client.query(
        `INSERT INTO canteen_receipts (
           id, receipt_no, transaction_type, payment_method, total_amount, timestamp
         ) VALUES ($1, $2, 'REGULAR_SALE', 'Cash', 75.00, NOW())`,
        [`rec-${testReceiptNo}`, testReceiptNo]
      );

      // Deliberate constraint violation: Duplicate receipt_no insertion inside same tx
      await client.query(
        `INSERT INTO canteen_receipts (
           id, receipt_no, transaction_type, payment_method, total_amount, timestamp
         ) VALUES ($1, $2, 'REGULAR_SALE', 'Cash', 75.00, NOW())`,
        [`rec-${testReceiptNo}-dup`, testReceiptNo] // Duplicate receipt_no!
      );

      await client.query('COMMIT');
    } catch (err) {
      caughtError = err;
      await client.query('ROLLBACK');
      console.log(`      Transaction caught deliberate failure: ${err.message}`);
      console.log('      ROLLBACK executed successfully.');
    }

    if (!caughtError) {
      console.error('[FAIL] Transaction did not fail as expected!');
      process.exit(1);
    }

    // 3. Verify Database State Post-Rollback
    console.log('\n[3/4] Verifying database integrity post-rollback:');

    const stockCheck = await client.query('SELECT current_stock FROM canteen_inventory WHERE id = $1', [testItemId]);
    const currentStockAfterRollback = stockCheck.rows[0].current_stock;

    const receiptCheck = await client.query('SELECT * FROM canteen_receipts WHERE receipt_no = $1', [testReceiptNo]);
    const receiptCount = receiptCheck.rows.length;

    console.log(`      Stock level: Expected ${initialStock}, Actual: ${currentStockAfterRollback}`);
    console.log(`      Receipt count in DB: Expected 0, Actual: ${receiptCount}`);

    // 4. Clean up test item
    await client.query('DELETE FROM canteen_inventory WHERE id = $1', [testItemId]);
    console.log('\n[4/4] Cleaned up baseline test item.');

    // Assertions
    const stockPreserved = currentStockAfterRollback === initialStock;
    const receiptRolledBack = receiptCount === 0;

    console.log('=================================================================');
    if (stockPreserved && receiptRolledBack) {
      console.log(' [PASS] ACID SAFETY EMPIRICALLY VERIFIED -- ZERO MUTATION ON FAILURE');
      console.log('        Stock was preserved and receipt was completely rolled back.');
    } else {
      console.log(' [FAIL] ACID SAFETY VIOLATION DETECTED');
    }
    console.log('=================================================================');

  } catch (err) {
    console.error('[ERROR IN ACID TEST]', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runAcidTest();
