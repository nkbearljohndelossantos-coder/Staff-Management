import fs from 'fs';
import { query, getClient } from '../config/database.js';

// ==============================================================================
// 1. INVENTORY MANAGEMENT
// ==============================================================================

export const getInventory = async (req, res) => {
  try {
    const { category, search, active_only } = req.query;
    let sql = 'SELECT * FROM canteen_inventory WHERE 1=1';
    const params = [];

    if (active_only !== 'false') {
      sql += ' AND is_active = TRUE';
    }

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(COALESCE(barcode, '')) LIKE $${params.length} OR LOWER(COALESCE(brand, '')) LIKE $${params.length})`;
    }

    sql += ' ORDER BY name ASC';

    const result = await query(sql, params);
    const rows = result.rows.map(row => ({
      ...row,
      sellingPrice: Number(row.selling_price || 0),
      costPrice: Number(row.cost_price || 0),
      quantity: parseInt(row.current_stock || 0, 10),
      currentStock: parseInt(row.current_stock || 0, 10),
      reorderLevel: parseInt(row.minimum_stock || 5, 10),
      unitPrice: Number(row.selling_price || 0),
      retailPiecePrice: Number(row.piece_selling_price || 0),
      piecesPerPack: parseInt(row.pieces_per_box || 1, 10),
      hasRetailPiece: Boolean(row.is_box_item)
    }));
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('[CANTEEN GET_INVENTORY ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve canteen inventory' });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const {
      id,
      barcode,
      name,
      category = 'General',
      brand,
      company,
      size,
      unit = 'Piece',
      cost_price = (req.body.costPrice !== undefined ? req.body.costPrice : 0),
      selling_price = (req.body.sellingPrice !== undefined ? req.body.sellingPrice : (req.body.unitPrice !== undefined ? req.body.unitPrice : 0)),
      current_stock = (req.body.quantity !== undefined ? req.body.quantity : (req.body.currentStock !== undefined ? req.body.currentStock : 0)),
      minimum_stock = (req.body.reorderLevel !== undefined ? req.body.reorderLevel : 5),
      is_box_item = (req.body.hasRetailPiece !== undefined ? req.body.hasRetailPiece : (req.body.isBoxItem !== undefined ? req.body.isBoxItem : false)),
      pieces_per_box = (req.body.piecesPerPack !== undefined ? req.body.piecesPerPack : 1),
      piece_selling_price = (req.body.retailPiecePrice !== undefined ? req.body.retailPiecePrice : 0),
      expiration_date = req.body.expirationDate,
      is_active = true
    } = req.body;

    const itemId = id || `item-${Date.now()}`;

    const sql = `
      INSERT INTO canteen_inventory (
        id, barcode, name, category, brand, company, size, unit,
        cost_price, selling_price, current_stock, minimum_stock,
        is_box_item, pieces_per_box, piece_selling_price, expiration_date, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const result = await query(sql, [
      itemId, barcode || null, name, category, brand || null, company || null, size || null, unit,
      Number(cost_price).toFixed(2), Number(selling_price).toFixed(2), parseInt(current_stock, 10), parseInt(minimum_stock, 10),
      Boolean(is_box_item), parseInt(pieces_per_box, 10), Number(piece_selling_price).toFixed(2), expiration_date || null, is_active
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[CANTEEN CREATE_INVENTORY ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to create inventory item: ' + error.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates = { ...body };

    // Support camelCase aliases from frontend
    if (updates.costPrice !== undefined && updates.cost_price === undefined) updates.cost_price = updates.costPrice;
    if (updates.sellingPrice !== undefined && updates.selling_price === undefined) updates.selling_price = updates.sellingPrice;
    if (updates.unitPrice !== undefined && updates.selling_price === undefined) updates.selling_price = updates.unitPrice;
    if (updates.quantity !== undefined && updates.current_stock === undefined) updates.current_stock = updates.quantity;
    if (updates.currentStock !== undefined && updates.current_stock === undefined) updates.current_stock = updates.currentStock;
    if (updates.reorderLevel !== undefined && updates.minimum_stock === undefined) updates.minimum_stock = updates.reorderLevel;
    if (updates.retailPiecePrice !== undefined && updates.piece_selling_price === undefined) updates.piece_selling_price = updates.retailPiecePrice;
    if (updates.piecesPerPack !== undefined && updates.pieces_per_box === undefined) updates.pieces_per_box = updates.piecesPerPack;
    if (updates.hasRetailPiece !== undefined && updates.is_box_item === undefined) updates.is_box_item = updates.hasRetailPiece;
    if (updates.isBoxItem !== undefined && updates.is_box_item === undefined) updates.is_box_item = updates.isBoxItem;
    if (updates.expirationDate !== undefined && updates.expiration_date === undefined) updates.expiration_date = updates.expirationDate;
    if (updates.isActive !== undefined && updates.is_active === undefined) updates.is_active = updates.isActive;

    const allowed = [
      'barcode', 'name', 'category', 'brand', 'company', 'size', 'unit',
      'cost_price', 'selling_price', 'current_stock', 'minimum_stock',
      'is_box_item', 'pieces_per_box', 'piece_selling_price', 'expiration_date', 'is_active'
    ];

    const setClauses = [];
    const params = [id];

    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        params.push(updates[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    setClauses.push('updated_at = NOW()');

    const sql = `
      UPDATE canteen_inventory
      SET ${setClauses.join(', ')}
      WHERE id = $1 OR barcode = $1
      RETURNING *
    `;

    const result = await query(sql, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[CANTEEN UPDATE_INVENTORY ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to update inventory item' });
  }
};

export const resetInventoryStock = async (req, res) => {
  try {
    const { mode, id, quantity, items } = req.body || {};

    // 1. Single item reset
    if (id !== undefined) {
      const qty = Math.max(0, parseInt(quantity, 10) || 0);
      const sql = 'UPDATE canteen_inventory SET current_stock = $1, updated_at = NOW() WHERE id = $2 OR barcode = $2 RETURNING *';
      const result = await query(sql, [qty, id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Inventory item not found' });
      }
      return res.json({ success: true, count: 1, data: result.rows[0] });
    }

    // 2. Reset all stock to 0
    if (mode === 'zero') {
      const sql = 'UPDATE canteen_inventory SET current_stock = 0, updated_at = NOW()';
      const result = await query(sql);
      return res.json({ success: true, count: result.rowCount, message: 'All inventory stock counts reset to 0' });
    }

    // 3. Restore masterlist default stocks
    if (mode === 'masterlist') {
      let targetItems = items;
      if (!Array.isArray(targetItems) || targetItems.length === 0) {
        try {
          const raw = fs.readFileSync(new URL('../data/canteenInventory.json', import.meta.url), 'utf-8');
          const parsed = JSON.parse(raw);
          targetItems = parsed.products || parsed;
        } catch (e) {
          console.warn('[RESET STOCK MASTERLIST FILE READ WARNING]', e.message);
        }
      }

      if (Array.isArray(targetItems) && targetItems.length > 0) {
        const values = [];
        const params = [];
        targetItems.forEach((it) => {
          const itId = it.id;
          const qty = Math.max(0, parseInt(it.quantity ?? it.current_stock ?? 0, 10) || 0);
          if (itId) {
            params.push(itId, qty);
            values.push(`($${params.length - 1}::varchar, $${params.length}::int)`);
          }
        });

        if (values.length > 0) {
          const sql = `
            UPDATE canteen_inventory AS ci
            SET current_stock = v.quantity, updated_at = NOW()
            FROM (VALUES ${values.join(', ')}) AS v(id, quantity)
            WHERE ci.id = v.id
          `;
          const result = await query(sql, params);
          return res.json({ success: true, count: result.rowCount, message: 'Masterlist stock levels restored' });
        }
      }
      return res.status(400).json({ success: false, error: 'No items provided for masterlist restore' });
    }

    return res.status(400).json({ success: false, error: 'Invalid reset parameters' });
  } catch (error) {
    console.error('[CANTEEN RESET_STOCK ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to reset inventory stock: ' + error.message });
  }
};

// ==============================================================================
// 2. POS SALES TRANSACTIONS & RECEIPTS (ACID GUARANTEED)
// ==============================================================================

export const getReceipts = async (req, res) => {
  try {
    const { staff_id, payment_method, start_date, end_date, type } = req.query;

    // Validate page and limit
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const isAll = req.query.limit === 'all';
    const limitNum = isAll ? null : Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offsetNum = isAll ? 0 : (pageNum - 1) * limitNum;

    // Shared filter conditions for both count and data queries
    const conditions = [];
    const params = [];

    // Strict Quarantine Isolation
    if (type === 'quarantined') {
      conditions.push(`r.transaction_type IN ('UNPOSTED_RECEIPT_PENDING_APPROVAL', 'POSSIBLE_DUPLICATE_PENDING_REVIEW')`);
    } else if (type === 'all') {
      // Historical audit: returns all 1,165 receipts (regular + quarantined)
    } else {
      // Default: isolate quarantined receipts, return only regular posted sales
      conditions.push(`r.transaction_type = 'REGULAR_SALE'`);
    }

    if (staff_id) {
      params.push(staff_id);
      conditions.push(`r.staff_id = $${params.length}`);
    }

    if (payment_method) {
      params.push(payment_method);
      conditions.push(`r.payment_method = $${params.length}`);
    }

    if (start_date) {
      params.push(start_date);
      conditions.push(`r.timestamp >= $${params.length}`);
    }

    if (end_date) {
      params.push(end_date);
      conditions.push(`r.timestamp <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Count Query (Identical Filter)
    const countSql = `SELECT COUNT(DISTINCT r.id) AS total_count FROM canteen_receipts r ${whereClause}`;
    const countResult = await query(countSql, [...params]);
    const totalCount = parseInt(countResult.rows[0]?.total_count || '0', 10);

    // 2. Data Query (Identical Filter + Aggregation + Pagination)
    let dataSql = `
      SELECT r.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ri.id,
                   'item_id', ri.item_id,
                   'item_name', ri.item_name,
                   'quantity', ri.quantity,
                   'unit_price', ri.unit_price,
                   'total_price', ri.total_price
                 ) ORDER BY ri.id ASC
               ) FILTER (WHERE ri.id IS NOT NULL), '[]'
             ) AS items
      FROM canteen_receipts r
      LEFT JOIN canteen_receipt_items ri ON r.id = ri.receipt_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.timestamp DESC
    `;

    const dataParams = [...params];
    if (!isAll) {
      dataParams.push(limitNum);
      dataSql += ` LIMIT $${dataParams.length}`;
      dataParams.push(offsetNum);
      dataSql += ` OFFSET $${dataParams.length}`;
    }

    const result = await query(dataSql, dataParams);

    res.json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: isAll ? 'all' : limitNum,
      totalPages: isAll ? 1 : Math.ceil(totalCount / limitNum),
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('[CANTEEN GET_RECEIPTS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve sales receipts' });
  }
};

export const createReceipt = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      receipt_no,
      transaction_type = 'REGULAR_SALE',
      staff_id,
      staff_name,
      payment_method, // 'Salary Deduction' or 'Cash'
      subtotal = 0,
      discount = 0,
      total_amount,
      amount_tendered = 0,
      change_due = 0,
      cashier_id,
      cashier_name,
      items = [], // array of { item_id, item_name, quantity, unit_price, total_price }
      timestamp,
      metadata = {}
    } = req.body;

    const receiptId = `rec-${Date.now()}`;
    const receiptNumber = receipt_no || `REC-${Date.now().toString().slice(-8)}`;
    const txTimestamp = timestamp || new Date().toISOString();
    const parsedTotal = Number(total_amount || 0).toFixed(2);

    // 1. Insert Receipt
    const receiptInsertSql = `
      INSERT INTO canteen_receipts (
        id, receipt_no, transaction_type, staff_id, staff_name,
        payment_method, subtotal, discount, total_amount,
        amount_tendered, change_due, cashier_id, cashier_name,
        timestamp, metadata
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15
      )
      RETURNING *
    `;

    const receiptResult = await client.query(receiptInsertSql, [
      receiptId, receiptNumber, transaction_type, staff_id || null, staff_name || 'Walk-in Customer',
      payment_method, Number(subtotal).toFixed(2), Number(discount).toFixed(2), parsedTotal,
      Number(amount_tendered).toFixed(2), Number(change_due).toFixed(2), cashier_id || null, cashier_name || 'Cashier',
      txTimestamp, JSON.stringify(metadata)
    ]);

    // 2. Insert Items & Decrement Stock
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemId = it.item_id || null;
      const itemQty = Number(it.quantity || 1);
      const unitPrice = Number(it.unit_price || 0).toFixed(2);
      const totalPrice = Number(it.total_price || (itemQty * Number(unitPrice))).toFixed(2);

      await client.query(
        `INSERT INTO canteen_receipt_items (
           id, receipt_id, item_id, item_name, quantity, unit_price, total_price
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [`ri-${receiptId}-${i}`, receiptId, itemId, it.item_name || 'Item', itemQty, unitPrice, totalPrice]
      );

      // Deduct stock if itemId exists
      if (itemId) {
        await client.query(
          `UPDATE canteen_inventory
           SET current_stock = GREATEST(0, current_stock - $1), updated_at = NOW()
           WHERE id = $2`,
          [Math.ceil(itemQty), itemId]
        );
      }
    }

    // 3. If Salary Deduction, update Deduction Ledger and Accumulated Balance
    if (payment_method === 'Salary Deduction' && staff_id) {
      const deductionId = `ded-${receiptNumber}`;
      await client.query(
        `INSERT INTO canteen_deductions_ledger (
           id, staff_id, staff_name, receipt_no, amount, deduction_date, status
         ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'PENDING_CUTOFF')`,
        [deductionId, staff_id, staff_name || 'Staff Member', receiptNumber, parsedTotal]
      );

      // Upsert into accumulated balances
      await client.query(
        `INSERT INTO canteen_ledger_balances (staff_id, staff_name, accumulated_debt, last_transaction_date, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (staff_id) DO UPDATE
         SET accumulated_debt = canteen_ledger_balances.accumulated_debt + EXCLUDED.accumulated_debt,
             last_transaction_date = NOW(),
             updated_at = NOW()`,
        [staff_id, staff_name || 'Staff Member', parsedTotal]
      );
    }

    // 4. Record System Audit Trail
    await client.query(
      `INSERT INTO system_audit_trail (
         id, category, action, details, operator_id, operator_name, operator_role, target_id, new_value
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        `aud-${Date.now()}`,
        'CANTEEN_POS',
        'CREATE_RECEIPT',
        `POS Sale ${receiptNumber} processed via ${payment_method} for ₱${parsedTotal}`,
        cashier_id || 'pos-terminal',
        cashier_name || 'POS Cashier',
        'cashier',
        receiptNumber,
        JSON.stringify({ receipt_no: receiptNumber, total_amount: parsedTotal, items_count: items.length })
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: receiptResult.rows[0],
      items_recorded: items.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CANTEEN CREATE_RECEIPT TRANSACTION FAILED]', error);
    res.status(500).json({ success: false, error: 'Transaction rolled back. Failed to process sale: ' + error.message });
  } finally {
    client.release();
  }
};

// ==============================================================================
// 3. SALARY DEDUCTIONS & STAFF BALANCES
// ==============================================================================

export const getDeductionsLedger = async (req, res) => {
  try {
    const { staff_id, status } = req.query;
    let sql = 'SELECT * FROM canteen_deductions_ledger WHERE 1=1';
    const params = [];

    if (staff_id) {
      params.push(staff_id);
      sql += ` AND staff_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[CANTEEN GET_DEDUCTIONS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve deductions ledger' });
  }
};

export const getStaffBalances = async (req, res) => {
  try {
    const result = await query('SELECT * FROM canteen_ledger_balances ORDER BY accumulated_debt DESC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[CANTEEN GET_BALANCES ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve staff debt balances' });
  }
};

// ==============================================================================
// 4. CASH DRAWER SESSIONS
// ==============================================================================

export const getActiveDrawerSession = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM canteen_drawer_sessions WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1`
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    console.error('[CANTEEN GET_DRAWER ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve active drawer session' });
  }
};

export const openDrawerSession = async (req, res) => {
  try {
    const { cashier_id, cashier_name, opening_cash = 0 } = req.body;
    const sessionId = `draw-${Date.now()}`;
    const initialCash = Number(opening_cash).toFixed(2);

    const sql = `
      INSERT INTO canteen_drawer_sessions (
        id, cashier_id, cashier_name, opening_cash, current_balance, status, opened_at
      ) VALUES ($1, $2, $3, $4, $4, 'OPEN', NOW())
      RETURNING *
    `;

    const result = await query(sql, [sessionId, cashier_id, cashier_name, initialCash]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[CANTEEN OPEN_DRAWER ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to open drawer session' });
  }
};

export const closeDrawerSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { closing_cash } = req.body;

    const sql = `
      UPDATE canteen_drawer_sessions
      SET closing_cash = $1, status = 'CLOSED', closed_at = NOW()
      WHERE id = $2 AND status = 'OPEN'
      RETURNING *
    `;

    const result = await query(sql, [Number(closing_cash || 0).toFixed(2), id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Active drawer session not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[CANTEEN CLOSE_DRAWER ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to close drawer session' });
  }
};

// ==============================================================================
// 5. GATE PASSES & VOID LOGS
// ==============================================================================

export const getGatePasses = async (req, res) => {
  try {
    const result = await query('SELECT * FROM canteen_gate_passes ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[CANTEEN GET_GATE_PASSES ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve gate passes' });
  }
};

export const createGatePass = async (req, res) => {
  try {
    const { pass_no, issued_to, issued_by, reason, destination, items = [] } = req.body;
    const passId = `gp-${Date.now()}`;
    const passNum = pass_no || `GP-${Date.now().toString().slice(-6)}`;

    const sql = `
      INSERT INTO canteen_gate_passes (
        id, pass_no, issued_to, issued_by, reason, destination, issued_at, items
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING *
    `;

    const result = await query(sql, [
      passId, passNum, issued_to, issued_by, reason, destination, JSON.stringify(items)
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[CANTEEN CREATE_GATE_PASS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to create gate pass' });
  }
};

export const getVoidLogs = async (req, res) => {
  try {
    const result = await query('SELECT * FROM canteen_void_logs ORDER BY voided_at DESC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[CANTEEN GET_VOID_LOGS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve void logs' });
  }
};

// ==============================================================================
// 6. INBOUND SALES INVOICES
// ==============================================================================

export const getSalesInvoices = async (req, res) => {
  try {
    const { supplier, status } = req.query;
    let sql = `
      SELECT i.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ii.id,
                   'name', ii.name,
                   'category', ii.category,
                   'quantity', ii.quantity,
                   'cost_price', ii.cost_price,
                   'selling_price', ii.selling_price,
                   'total_cost', ii.total_cost,
                   'barcode', ii.barcode
                 )
               ) FILTER (WHERE ii.id IS NOT NULL), '[]'
             ) AS items
      FROM canteen_sales_invoices i
      LEFT JOIN canteen_sales_invoice_items ii ON i.id = ii.invoice_id
      WHERE 1=1
    `;
    const params = [];
    if (supplier) {
      params.push(`%${supplier.trim().toLowerCase()}%`);
      sql += ` AND LOWER(i.supplier) LIKE $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }
    sql += ' GROUP BY i.id ORDER BY i.created_at DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[CANTEEN GET_INVOICES ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve sales invoices' });
  }
};

export const createSalesInvoice = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      invoice_number,
      supplier,
      purchase_date,
      received_date,
      payment_method = 'Company Fund',
      payment_status = 'Paid',
      total_amount = 0,
      encoded_by,
      notes,
      items = []
    } = req.body;

    const invoiceId = `INV-${Date.now()}`;
    const invNum = invoice_number || `SI-${Date.now().toString().slice(-8)}`;
    const parsedTotal = Number(total_amount).toFixed(2);

    const invSql = `
      INSERT INTO canteen_sales_invoices (
        id, invoice_number, supplier, purchase_date, received_date,
        payment_method, payment_status, total_amount, items_count,
        total_units, encoded_by, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'POSTED_TO_INVENTORY', NOW())
      RETURNING *
    `;

    let totalUnits = 0;
    items.forEach(it => { totalUnits += Number(it.quantity || 1); });

    const invRes = await client.query(invSql, [
      invoiceId, invNum, supplier || 'General Supplier', purchase_date || null, received_date || null,
      payment_method, payment_status, parsedTotal, items.length,
      Math.ceil(totalUnits), encoded_by || 'Staff', notes || null
    ]);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const itemId = `invitem-${invoiceId}-${i}`;
      await client.query(
        `INSERT INTO canteen_sales_invoice_items (
           id, invoice_id, name, category, brand, company, size, unit,
           quantity, cost_price, selling_price, total_cost, barcode, expiration_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          itemId, invoiceId, it.name || 'Item', it.category || null, it.brand || null,
          it.company || null, it.size || null, it.unit || 'Piece',
          Number(it.quantity || 1).toFixed(2), Number(it.cost_price || 0).toFixed(2),
          Number(it.selling_price || 0).toFixed(2), Number(it.total_cost || 0).toFixed(2),
          it.barcode || null, it.expiration_date || null
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: invRes.rows[0], items_count: items.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CANTEEN CREATE_INVOICE ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to record invoice: ' + error.message });
  } finally {
    client.release();
  }
};

// ==============================================================================
// 7. CASH DRAWER TRANSACTIONS
// ==============================================================================

export const getDrawerTransactions = async (req, res) => {
  try {
    const { session_id } = req.query;
    let sql = 'SELECT * FROM canteen_drawer_transactions WHERE 1=1';
    const params = [];
    if (session_id) {
      params.push(session_id);
      sql += ` AND session_id = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[CANTEEN GET_DRAWER_TX ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve drawer transactions' });
  }
};

export const recordDrawerTransaction = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { session_id, transaction_type, amount, description, reference_id } = req.body;
    const txId = `dtx-${Date.now()}`;
    const parsedAmount = Number(amount).toFixed(2);

    await client.query(
      `INSERT INTO canteen_drawer_transactions (
         id, session_id, transaction_type, amount, description, reference_id, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [txId, session_id, transaction_type, parsedAmount, description || null, reference_id || null]
    );

    // Adjust session balance
    const multiplier = transaction_type === 'CASH_IN' || transaction_type === 'PAYMENT' ? 1 : -1;
    await client.query(
      `UPDATE canteen_drawer_sessions
       SET current_balance = current_balance + $1
       WHERE id = $2`,
      [multiplier * Number(parsedAmount), session_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, id: txId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[CANTEEN RECORD_DRAWER_TX ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to record drawer transaction' });
  } finally {
    client.release();
  }
};

// ==============================================================================
// 8. MANUFACTURING PRODUCTS (mfg_products)
// ==============================================================================

export const getMfgProducts = async (req, res) => {
  try {
    const result = await query('SELECT * FROM mfg_products WHERE is_active = TRUE ORDER BY name ASC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[MFG GET_PRODUCTS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve manufacturing products' });
  }
};

export const createMfgProduct = async (req, res) => {
  try {
    const { id, code, name, category, unit = 'Piece', unit_price = 0 } = req.body;
    const prodId = id || `mfg-${Date.now()}`;
    const sql = `
      INSERT INTO mfg_products (id, code, name, category, unit, unit_price, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
      RETURNING *
    `;
    const result = await query(sql, [prodId, code || null, name, category || null, unit, Number(unit_price).toFixed(2)]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[MFG CREATE_PRODUCT ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to create manufacturing product' });
  }
};
