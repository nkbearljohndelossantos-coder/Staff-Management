import { query } from '../config/database.js';

export const getAllStaff = async (req, res) => {
  try {
    const { department_id, role, is_active, search } = req.query;
    let sql = `
      SELECT s.id, s.employee_id, s.username, s.first_name, s.last_name, s.email, s.phone,
             s.role, s.employment_type, s.department_id, s.position_id, s.hire_date,
             s.birth_date, s.address, s.tin, s.sss, s.philhealth, s.pagibig, s.bank_account,
             s.avatar_url, s.is_active, s.source_variant, s.metadata, s.created_at, s.updated_at,
             d.name AS department_name, p.title AS position_title
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN positions p ON s.position_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      params.push(department_id);
      sql += ` AND s.department_id = $${params.length}`;
    }

    if (role) {
      params.push(role);
      sql += ` AND s.role = $${params.length}`;
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      sql += ` AND s.is_active = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(s.first_name) LIKE $${params.length} OR
        LOWER(s.last_name) LIKE $${params.length} OR
        LOWER(s.employee_id) LIKE $${params.length} OR
        LOWER(s.username) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY s.first_name ASC, s.last_name ASC`;

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[GET ALL STAFF ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve staff records' });
  }
};

export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT s.*, d.name AS department_name, p.title AS position_title
       FROM staff s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN positions p ON s.position_id = p.id
       WHERE s.id = $1 OR s.employee_id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const staff = result.rows[0];
    delete staff.password_hash;

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('[GET STAFF BY ID ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve staff record' });
  }
};

export const createStaff = async (req, res) => {
  try {
    const {
      id,
      employee_id,
      username,
      first_name,
      last_name,
      email,
      phone,
      role = 'employee',
      employment_type = 'regular',
      department_id,
      position_id,
      hire_date,
      birth_date,
      address,
      tin,
      sss,
      philhealth,
      pagibig,
      bank_account,
      avatar_url,
      is_active = true,
      metadata = {}
    } = req.body;

    const staffId = id || `emp-${Date.now()}`;
    const empId = employee_id || staffId;
    const uName = username || `user_${empId}`;

    const insertSql = `
      INSERT INTO staff (
        id, employee_id, username, first_name, last_name, email, phone,
        role, employment_type, department_id, position_id, hire_date,
        birth_date, address, tin, sss, philhealth, pagibig, bank_account,
        avatar_url, is_active, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22
      )
      RETURNING *
    `;

    const result = await query(insertSql, [
      staffId, empId, uName, first_name || 'Staff', last_name || 'Member', email, phone,
      role, employment_type, department_id, position_id, hire_date || null,
      birth_date || null, address, tin, sss, philhealth, pagibig, bank_account,
      avatar_url, is_active, JSON.stringify(metadata)
    ]);

    const created = result.rows[0];
    delete created.password_hash;

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('[CREATE STAFF ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to create staff record: ' + error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Filter allowed fields
    const allowed = [
      'employee_id', 'username', 'first_name', 'last_name', 'email', 'phone', 'role', 'employment_type',
      'department_id', 'position_id', 'hire_date', 'birth_date', 'address',
      'tin', 'sss', 'philhealth', 'pagibig', 'bank_account', 'avatar_url',
      'is_active', 'source_variant', 'metadata'
    ];

    const setClauses = [];
    const params = [id];

    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        params.push(key === 'metadata' && typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    setClauses.push('updated_at = NOW()');

    const sql = `
      UPDATE staff
      SET ${setClauses.join(', ')}
      WHERE id = $1 OR employee_id = $1 OR LOWER(id) = LOWER($1) OR LOWER(employee_id) = LOWER($1)
      RETURNING *
    `;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const updated = result.rows[0];
    delete updated.password_hash;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[UPDATE STAFF ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to update staff record: ' + error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `DELETE FROM staff WHERE id = $1 OR employee_id = $1 OR LOWER(id) = LOWER($1) OR LOWER(employee_id) = LOWER($1) RETURNING id, employee_id, first_name, last_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({ 
      success: true, 
      message: 'Staff member deleted successfully from database', 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('[DELETE STAFF ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to delete staff record: ' + error.message });
  }
};

export const batchSyncStaff = async (req, res) => {
  try {
    const { staff } = req.body;
    if (!Array.isArray(staff) || staff.length === 0) {
      return res.status(400).json({ success: false, error: 'staff array required' });
    }

    const upsertSql = `
      INSERT INTO staff (
        id, employee_id, username, first_name, last_name, email, phone,
        role, employment_type, department_id, position_id, hire_date,
        birth_date, address, tin, sss, philhealth, pagibig, bank_account,
        avatar_url, is_active, metadata, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = COALESCE(EXCLUDED.email, staff.email),
        phone = COALESCE(EXCLUDED.phone, staff.phone),
        role = EXCLUDED.role,
        employment_type = EXCLUDED.employment_type,
        department_id = COALESCE(EXCLUDED.department_id, staff.department_id),
        position_id = COALESCE(EXCLUDED.position_id, staff.position_id),
        hire_date = COALESCE(EXCLUDED.hire_date, staff.hire_date),
        birth_date = COALESCE(EXCLUDED.birth_date, staff.birth_date),
        address = COALESCE(EXCLUDED.address, staff.address),
        tin = COALESCE(EXCLUDED.tin, staff.tin),
        sss = COALESCE(EXCLUDED.sss, staff.sss),
        philhealth = COALESCE(EXCLUDED.philhealth, staff.philhealth),
        pagibig = COALESCE(EXCLUDED.pagibig, staff.pagibig),
        bank_account = COALESCE(EXCLUDED.bank_account, staff.bank_account),
        avatar_url = COALESCE(EXCLUDED.avatar_url, staff.avatar_url),
        is_active = EXCLUDED.is_active,
        metadata = COALESCE(EXCLUDED.metadata, staff.metadata),
        updated_at = NOW()
      RETURNING id, employee_id
    `;

    const synced = [];
    for (const item of staff) {
      const staffId = item.id || `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const empId = item.employee_id || item.employeeId || staffId;
      const uName = item.username || `user_${empId}`;
      const fName = (item.first_name || item.firstName || 'Staff').toString().trim().toUpperCase();
      const lName = (item.last_name || item.lastName || 'Member').toString().trim().toUpperCase();

      const meta = item.metadata || {
        pin: item.pin,
        baseSalary: item.baseSalary,
        salaryRate: item.salaryRate,
        payFrequency: item.payFrequency,
        rawName: item.rawName
      };

      const resRow = await query(upsertSql, [
        staffId,
        empId,
        uName,
        fName,
        lName,
        item.email || null,
        item.phone || null,
        item.role || 'employee',
        item.employment_type || item.employmentType || 'regular',
        item.department_id || item.departmentId || null,
        item.position_id || item.positionId || null,
        item.hire_date || item.hireDate || null,
        item.birth_date || item.birthday || null,
        item.address || null,
        item.tin || null,
        item.sss || item.sssNo || null,
        item.philhealth || item.philHealthNo || null,
        item.pagibig || item.hdmfNo || null,
        item.bank_account || item.bankAccount || null,
        item.avatar_url || item.avatar || null,
        item.is_active !== undefined ? item.is_active : (item.status ? item.status === 'active' : true),
        JSON.stringify(meta)
      ]);
      synced.push(resRow.rows[0]);
    }

    res.json({ success: true, count: synced.length, data: synced });
  } catch (error) {
    console.error('[BATCH SYNC STAFF ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to batch sync staff: ' + error.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const result = await query('SELECT * FROM departments ORDER BY name ASC');
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[GET DEPARTMENTS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve departments' });
  }
};

export const getPositions = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, d.name AS department_name
      FROM positions p
      LEFT JOIN departments d ON p.department_id = d.id
      ORDER BY p.title ASC
    `);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[GET POSITIONS ERROR]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve positions' });
  }
};
