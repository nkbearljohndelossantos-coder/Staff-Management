import { query } from '../config/database.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { category, operator_id, start_date, end_date, limit = 100 } = req.query;
    let sql = 'SELECT * FROM system_audit_trail WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (operator_id) {
      params.push(operator_id);
      sql += ` AND operator_id = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      sql += ` AND created_at >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      sql += ` AND created_at <= $${params.length}`;
    }

    params.push(parseInt(limit, 10));
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[AUDIT GET_LOGS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve audit trail' });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const {
      category = 'GENERAL',
      action,
      details,
      operator_id,
      operator_name,
      operator_role,
      target_id,
      previous_value,
      new_value
    } = req.body;

    const auditId = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const sql = `
      INSERT INTO system_audit_trail (
        id, category, action, details, operator_id, operator_name,
        operator_role, target_id, previous_value, new_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(sql, [
      auditId,
      category,
      action,
      details,
      operator_id || (req.user ? req.user.id : 'SYSTEM'),
      operator_name || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System Automated'),
      operator_role || (req.user ? req.user.role : 'system'),
      target_id || null,
      previous_value ? JSON.stringify(previous_value) : null,
      new_value ? JSON.stringify(new_value) : null
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[AUDIT CREATE_LOG ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to record audit entry' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[AUDIT GET_NOTIFICATIONS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
};
