const fs = require('fs');

const genData = JSON.parse(fs.readFileSync('src/data/generatedStaff.json', 'utf8'));
const staff = genData.staff;

let sql = '-- Sync all staff to PostgreSQL\nBEGIN;\n\n';

// 1. Ensure pos-1793078650801 exists
sql += `INSERT INTO positions (id, title, department_id) VALUES ('pos-1793078650801', 'Billing Officer', 'dept-fin') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, department_id = EXCLUDED.department_id;\n\n`;

// 2. Upsert each staff member
staff.forEach(s => {
  const staffId = s.id;
  const empId = s.employeeId;
  const uName = s.username || ('user_' + empId.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const first = (s.firstName || 'Staff').replace(/'/g, "''");
  const last = (s.lastName || 'Member').replace(/'/g, "''");
  const email = (s.email || '').replace(/'/g, "''");
  const phone = (s.phone || '').replace(/'/g, "''");
  const role = s.role || 'employee';
  const empType = s.employmentType || (empId.startsWith('PRJ') ? 'project_based' : 'regular');
  const deptId = s.departmentId || null;
  const posId = s.positionId || null;
  const hireDate = s.hireDate || s.dateHired || '2026-05-01';
  const birthDate = s.birthday || null;
  const addr = (s.address || 'Subic Bay Gateway Park, Olongapo City, Zambales').replace(/'/g, "''");
  const tin = (s.tin || '').replace(/'/g, "''");
  const sss = (s.sssNo || '').replace(/'/g, "''");
  const phil = (s.philHealthNo || '').replace(/'/g, "''");
  const pag = (s.hdmfNo || '').replace(/'/g, "''");
  const bank = (s.bankAccount || '').replace(/'/g, "''");
  const avatar = (s.avatar || '').replace(/'/g, "''");
  const isActive = s.status !== 'inactive';
  const meta = JSON.stringify({
    rawName: s.rawName || (s.lastName + ', ' + s.firstName),
    salaryRate: s.salaryRate || 20000,
    baseSalary: s.baseSalary || 20000,
    salaryRateType: s.salaryRateType || 'monthly',
    barcodeValue: s.barcodeValue || empId,
    departmentName: s.departmentName,
    positionTitle: s.positionTitle
  }).replace(/'/g, "''");

  sql += `INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    '${staffId}', '${empId}', '${uName}', '${first}', '${last}', '${email}', '${phone}',
    '${role}', '${empType}', ${deptId ? `'${deptId}'` : 'NULL'}, ${posId ? `'${posId}'` : 'NULL'}, '${hireDate}',
    ${birthDate ? `'${birthDate}'` : 'NULL'}, '${addr}', '${tin}', '${sss}', '${phil}', '${pag}', '${bank}',
    '${avatar}', ${isActive}, '${meta}'::jsonb, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    employment_type = EXCLUDED.employment_type,
    department_id = EXCLUDED.department_id,
    position_id = EXCLUDED.position_id,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();\n`;
});

sql += '\nCOMMIT;\n';

fs.writeFileSync('scripts/sync_all_staff.sql', sql, 'utf8');
console.log('Generated scripts/sync_all_staff.sql with', staff.length, 'staff upsert statements.');
