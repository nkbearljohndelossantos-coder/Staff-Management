-- Sync all staff to PostgreSQL
BEGIN;

INSERT INTO positions (id, title, department_id) VALUES ('pos-1793078650801', 'Billing Officer', 'dept-fin') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, department_id = EXCLUDED.department_id;

INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-screenshot-1', 'NKB112026-0050', 'akisha.alonzo', 'AKISHA', 'ALONZO', 'akisha@nkb.com', '+63 900000050',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"ALONZO, AKISHA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB112026-0050","departmentName":"Production & Manufacturing","positionTitle":"Production Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0003', 'NKB052026-0003', 'merryjeani.alonzo', 'MERRY JEAN I.', 'ALONZO', 'merryjeani.alonzo@nkb.com', '+63 900000002',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-003', '03-8899003-1', '12-094820192-1', '1210-9482-0192', '00102-44202-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"ALONZO, MERRY JEAN I.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0003","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0001', 'PRJ2026-0001', 'wenjielyn.amolo', 'WENJIELYN', 'AMOLO', 'wenjielyn.amolo@nkb.com', '+63 900000050',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-051', '03-8899051-1', '12-094820192-1', '1210-9482-0192', '00150-44250-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"AMOLO, WENJIELYN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0001","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-screenshot-2', 'NKB112026-0051', 'jancecilyne.arfola', 'JAN CECILYNE', 'ARFOLA', 'jancecilyne@nkb.com', '+63 900000051',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"ARFOLA, JAN CECILYNE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB112026-0051","departmentName":"Production & Manufacturing","positionTitle":"Production Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0004', 'NKB052026-0004', 'emmiem.atayde', 'EMMIE M.', 'ATAYDE', 'emmiem.atayde@nkb.com', '+63 900000003',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-004', '03-8899004-1', '12-094820192-1', '1210-9482-0192', '00103-44203-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"ATAYDE, EMMIE M.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0004","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0005', 'NKB052026-0005', 'marving.atayde', 'MARVIN G.', 'ATAYDE', 'marving.atayde@nkb.com', '+63 900000004',
    'security', 'regular', 'dept-sec', 'pos-sec', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-005', '03-8899005-1', '12-094820192-1', '1210-9482-0192', '00104-44204-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"ATAYDE, MARVIN G.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0005","departmentName":"Plant Security & Safety","positionTitle":"Plant Security & Safety Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792393261701', 'PRJ-2026-0044', 'jazul', 'JONEL', 'AZUL', 'jonel@nkb.com', '+63 900000044',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"AZUL, JONEL","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0044"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792393303063', 'PRJ-2026-0045', 'rballon', 'ROSELYN', 'BALLON', 'roselyn@nkb.com', '+63 900000045',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"BALLON, ROSELYN","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0045"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792393880172', 'PRJ-2026-0048', 'cbareja', 'CHRISTIAN', 'BAREJA', 'tian@nkb.com', '+63 900000048',
    'employee', 'project_based', 'dept-wh', 'pos-wh', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"BAREJA, CHRISTIAN","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0048"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792393797130', 'PRJ-2026-0046', 'rbase', 'REYNAN', 'BASE', 'reynan@nkb.com', '+63 900000046',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"BASE, REYNAN","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0046"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0006', 'NKB052026-0006', 'allenl.bautista', 'ALLEN L.', 'BAUTISTA', 'allenl.bautista@nkb.com', '+63 900000005',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-006', '03-8899006-1', '12-094820192-1', '1210-9482-0192', '00105-44205-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BAUTISTA, ALLEN L.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0006","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-screenshot-4', 'NKB112026-0053', 'jeriel.bella', 'JERIEL', 'BELLA', 'jeriel@nkb.com', '+63 900000053',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"BELLA, JERIEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB112026-0053","departmentName":"Production & Manufacturing","positionTitle":"Production Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0001', 'NKB052026-0001', 'katherinea.bella', 'KATHERINE A.', 'BELLA', 'katherinea.bella@nkb.com', '+63 900000000',
    'ceo', 'regular', 'dept-exec', 'pos-exec', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-001', '03-8899001-1', '12-094820192-1', '1210-9482-0192', '00100-44200-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BELLA, KATHERINE A.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0001","departmentName":"Executive Leadership (CEO)","positionTitle":"Chief Executive Officer (CEO)"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0002', 'NKB052026-0002', 'norvinl.bella', 'NORVIN L.', 'BELLA', 'norvinl.bella@nkb.com', '+63 900000001',
    'admin', 'regular', 'dept-coo', 'pos-coo', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-002', '03-8899002-1', '12-094820192-1', '1210-9482-0192', '00101-44201-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BELLA, NORVIN L.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0002","departmentName":"Operations Executive (COO)","positionTitle":"Chief Operating Officer (COO)"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-screenshot-3', 'NKB112026-0052', 'yuan.bella', 'YUAN', 'BELLA', 'yuan@nkb.com', '+63 900000052',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"BELLA, YUAN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB112026-0052","departmentName":"Production & Manufacturing","positionTitle":"Production Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1793078219039', 'PRJ-2026-0042', 'j', 'JONALYN', 'BERNARDO', 'jo@nkb.com', '+63 900000042',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-27',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '', '', '',
    '', true, '{"rawName":"BERNARDO, JONALYN","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0042"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0039', 'PRJ2026-0039', 'charlotter.bertudazo', 'CHARLOTTE R.', 'BERTUDAZO', 'charlotter.bertudazo@nkb.com', '+63 900000088',
    'employee', 'project_based', 'dept-maint', 'pos-maint', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-089', '03-8899089-1', '12-094820192-1', '1210-9482-0192', '00188-44288-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BERTUDAZO, CHARLOTTE R.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0039","departmentName":"Plant Maintenance & Engineering","positionTitle":"Plant Maintenance & Engineering Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0032', 'PRJ2026-0032', 'michael.bobadilla', 'MICHAEL', 'BOBADILLA', 'michael.bobadilla@nkb.com', '+63 900000081',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-082', '03-8899082-1', '12-094820192-1', '1210-9482-0192', '00181-44281-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BOBADILLA, MICHAEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0032","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0002', 'PRJ2026-0002', 'rafaelrannie.bombita', 'RAFAEL RANNIE', 'BOMBITA', 'rafaelrannie.bombita@nkb.com', '+63 900000051',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-052', '03-8899052-1', '12-094820192-1', '1210-9482-0192', '00151-44251-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BOMBITA, RAFAEL RANNIE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0002","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0007', 'NKB052026-0007', 'raniellacamille.bombita', 'RANIELLA CAMILLE', 'BOMBITA', 'raniellacamille.bombita@nkb.com', '+63 900000006',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-007', '03-8899007-1', '12-094820192-1', '1210-9482-0192', '00106-44206-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BOMBITA, RANIELLA CAMILLE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0007","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0008', 'NKB052026-0008', 'kemmariel.boston', 'KEM MARIEL', 'BOSTON', 'kemmariel.boston@nkb.com', '+63 900000007',
    'employee', 'regular', 'dept-reg', 'pos-reg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-008', '03-8899008-1', '12-094820192-1', '1210-9482-0192', '00107-44207-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BOSTON, KEM MARIEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0008","departmentName":"Regulatory Affairs & Compliance","positionTitle":"Regulatory Affairs & Compliance Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-vyu2026-0001', 'VYU2026-0001', 'monet.boston', 'MONET', 'BOSTON', 'monet.boston@nkb.com', '+63 900000089',
    'employee', 'regular', 'dept-vyu', 'pos-vyu', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-090', '03-8899090-1', '12-094820192-1', '1210-9482-0192', '00189-44289-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"BOSTON, MONET","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"VYU2026-0001","departmentName":"Vyuceutical Laboratories","positionTitle":"Vyuceutical Laboratories Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792386590150', 'PRJ-2026-0041', 'jcabreza', 'JANETH', 'CABREZA', 'janeth@nkb.com', '+63 900000041',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"CABREZA, JANETH","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0041"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0003', 'PRJ2026-0003', 'rosepauline.camaa', 'ROSE PAULINE', 'CAMAÑA', 'rosepauline.camaa@nkb.com', '+63 900000052',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-053', '03-8899053-1', '12-094820192-1', '1210-9482-0192', '00152-44252-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CAMAÑA, ROSE PAULINE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0003","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkbcanteen', 'NKBCANTEEN', 'canteen', 'CANTEEN', 'Member', 'canteen@nkb.com', '+63 900000048',
    'canteen', 'regular', 'dept-cant', 'pos-cant', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-049', '03-8899049-1', '12-094820192-1', '1210-9482-0192', '00148-44248-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CANTEEN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKBCANTEEN","departmentName":"Canteen & Food Services","positionTitle":"Canteen POS Terminal"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0004', 'PRJ2026-0004', 'carlojay.carel', 'CARLO JAY', 'CAREL', 'carlojay.carel@nkb.com', '+63 900000053',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-054', '03-8899054-1', '12-094820192-1', '1210-9482-0192', '00153-44253-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CAREL, CARLO JAY","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0004","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792729896671', 'NKB102026-0049', 'fcaro', 'FRANK REY', 'CARO', 'frank@nkb.com', '+63 900000049',
    'employee', 'regular', 'dept-fin', 'pos-1793078650801', '2026-10-23',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '', '', '',
    '', true, '{"rawName":"CARO, FRANK REY","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"NKB102026-0049"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-screenshot-5', 'NKB112026-0054', 'rodz.castillo', 'RODZ', 'CASTILLO', 'rodz@nkb.com', '+63 900000054',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"CASTILLO, RODZ","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB112026-0054","departmentName":"Production & Manufacturing","positionTitle":"Production Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0009', 'NKB052026-0009', 'jhonjhonb.catalan', 'JHON JHON B.', 'CATALAN', 'jhonjhonb.catalan@nkb.com', '+63 900000008',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-009', '03-8899009-1', '12-094820192-1', '1210-9482-0192', '00108-44208-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CATALAN, JHON JHON B.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0009","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0005', 'PRJ2026-0005', 'dominick.cate', 'DOMINICK', 'CATE', 'dominick.cate@nkb.com', '+63 900000054',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-055', '03-8899055-1', '12-094820192-1', '1210-9482-0192', '00154-44254-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CATE, DOMINICK","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0005","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0010', 'NKB052026-0010', 'renara.catindig', 'RENAR A.', 'CATINDIG', 'renara.catindig@nkb.com', '+63 900000009',
    'employee', 'regular', 'dept-comp', 'pos-comp', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-010', '03-8899010-1', '12-094820192-1', '1210-9482-0192', '00109-44209-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CATINDIG, RENAR A.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0010","departmentName":"Compounding & Formulation","positionTitle":"Compounding & Formulation Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0006', 'PRJ2026-0006', 'jamrex.cedillo', 'JAMREX', 'CEDILLO', 'jamrex.cedillo@nkb.com', '+63 900000055',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-056', '03-8899056-1', '12-094820192-1', '1210-9482-0192', '00155-44255-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CEDILLO, JAMREX","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0006","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb082026-0046', 'NKB082026-0046', 'alexandra.cinco', 'ALEXANDRA', 'CINCO', 'alexandra.cinco@nkb.com', '+63 900000045',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-046', '03-8899046-1', '12-094820192-1', '1210-9482-0192', '00145-44245-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CINCO, ALEXANDRA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB082026-0046","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0007', 'PRJ2026-0007', 'rexc.corral', 'REX C.', 'CORRAL', 'rexc.corral@nkb.com', '+63 900000056',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-057', '03-8899057-1', '12-094820192-1', '1210-9482-0192', '00156-44256-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CORRAL, REX C.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0007","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0011', 'NKB052026-0011', 'rodolfoc.corral', 'RODOLFO C.', 'CORRAL', 'rodolfoc.corral@nkb.com', '+63 900000010',
    'employee', 'regular', 'dept-maint', 'pos-maint', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-011', '03-8899011-1', '12-094820192-1', '1210-9482-0192', '00110-44210-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CORRAL, RODOLFO C.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0011","departmentName":"Plant Maintenance & Engineering","positionTitle":"Plant Maintenance & Engineering Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0012', 'NKB052026-0012', 'roberto.cuya', 'ROBERTO', 'CUYA', 'roberto.cuya@nkb.com', '+63 900000011',
    'employee', 'regular', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-012', '03-8899012-1', '12-094820192-1', '1210-9482-0192', '00111-44211-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"CUYA, ROBERTO","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0012","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0008', 'PRJ2026-0008', 'markb.dalanon', 'MARK B.', 'DALANON', 'markb.dalanon@nkb.com', '+63 900000057',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-058', '03-8899058-1', '12-094820192-1', '1210-9482-0192', '00157-44257-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DALANON, MARK B.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0008","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0009', 'PRJ2026-0009', 'marsb.dalanon', 'MARS B.', 'DALANON', 'marsb.dalanon@nkb.com', '+63 900000058',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-059', '03-8899059-1', '12-094820192-1', '1210-9482-0192', '00158-44258-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DALANON, MARS B.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0009","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0013', 'NKB052026-0013', 'khaylenicoleg.dejesus', 'KHAYLE NICOLE G.', 'DE JESUS', 'khaylenicoleg.dejesus@nkb.com', '+63 900000012',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-013', '03-8899013-1', '12-094820192-1', '1210-9482-0192', '00112-44212-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DE JESUS, KHAYLE NICOLE G.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0013","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0010', 'PRJ2026-0010', 'maryann.delrosario', 'MARY ANN', 'DEL ROSARIO', 'maryann.delrosario@nkb.com', '+63 900000059',
    'employee', 'project_based', 'dept-maint', 'pos-maint', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-060', '03-8899060-1', '12-094820192-1', '1210-9482-0192', '00159-44259-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DEL ROSARIO, MARY ANN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0010","departmentName":"Plant Maintenance & Engineering","positionTitle":"Plant Maintenance & Engineering Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0011', 'PRJ2026-0011', 'marygrace.delsoccoro', 'MARY GRACE', 'DEL SOCCORO', 'marygrace.delsoccoro@nkb.com', '+63 900000060',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-061', '03-8899061-1', '12-094820192-1', '1210-9482-0192', '00160-44260-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DEL SOCCORO, MARY GRACE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0011","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0012', 'PRJ2026-0012', 'vincentlloyd.delacruz', 'VINCENT LLOYD', 'DELA CRUZ', 'vincentlloyd.delacruz@nkb.com', '+63 900000061',
    'employee', 'project_based', 'dept-wh', 'pos-wh', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-062', '03-8899062-1', '12-094820192-1', '1210-9482-0192', '00161-44261-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DELA CRUZ, VINCENT LLOYD","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0012","departmentName":"Inventory & Warehouse Logistics","positionTitle":"Inventory & Warehouse Logistics Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0014', 'NKB052026-0014', 'earljohn.delossantos', 'EARL JOHN', 'DELOS SANTOS', 'earljohn.delossantos@nkb.com', '+63 900000013',
    'it_admin', 'regular', 'dept-it', 'pos-it', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-014', '03-8899014-1', '12-094820192-1', '1210-9482-0192', '00113-44213-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"DELOS SANTOS, EARL JOHN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0014","departmentName":"Information Technology (IT)","positionTitle":"IT Systems Administrator"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0013', 'PRJ2026-0013', 'marilou.fabio', 'MARILOU', 'FABIO', 'marilou.fabio@nkb.com', '+63 900000062',
    'employee', 'project_based', 'dept-qc', 'pos-qc', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-063', '03-8899063-1', '12-094820192-1', '1210-9482-0192', '00162-44262-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"FABIO, MARILOU","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0013","departmentName":"Quality Control (QC)","positionTitle":"Quality Control (QC) Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0041', 'NKB052026-0041', 'jonnel.gacia', 'JONNEL', 'GACIA', 'jonnel.gacia@nkb.com', '+63 900000040',
    'employee', 'regular', 'dept-log', 'pos-log', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-041', '03-8899041-1', '12-094820192-1', '1210-9482-0192', '00140-44240-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"GACIA, JONNEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0041","departmentName":"Fleet & Dispatch Logistics","positionTitle":"Fleet & Dispatch Logistics Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0015', 'NKB052026-0015', 'jayveeg.garcia', 'JAYVEE G.', 'GARCIA', 'jayveeg.garcia@nkb.com', '+63 900000014',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-015', '03-8899015-1', '12-094820192-1', '1210-9482-0192', '00114-44214-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"GARCIA, JAYVEE G.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0015","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0014', 'PRJ2026-0014', 'raquel.gerero', 'RAQUEL', 'GERERO', 'raquel.gerero@nkb.com', '+63 900000063',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-064', '03-8899064-1', '12-094820192-1', '1210-9482-0192', '00163-44263-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"GERERO, RAQUEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0014","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0036', 'PRJ2026-0036', 'isagani.gulliermo', 'ISAGANI', 'GULLIERMO', 'isagani.gulliermo@nkb.com', '+63 900000085',
    'employee', 'project_based', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-086', '03-8899086-1', '12-094820192-1', '1210-9482-0192', '00185-44285-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"GULLIERMO, ISAGANI","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0036","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0016', 'NKB052026-0016', 'jaime.gulliermo', 'JAIME', 'GULLIERMO', 'jaime.gulliermo@nkb.com', '+63 900000015',
    'employee', 'regular', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-016', '03-8899016-1', '12-094820192-1', '1210-9482-0192', '00115-44215-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"GULLIERMO, JAIME","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0016","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0017', 'NKB052026-0017', 'heramae.gutierrez', 'HERAMAE', 'GUTIERREZ', 'heramae.gutierrez@nkb.com', '+63 900000016',
    'employee', 'regular', 'dept-purch', 'pos-purch', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-017', '03-8899017-1', '12-094820192-1', '1210-9482-0192', '00116-44216-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"GUTIERREZ, HERAMAE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0017","departmentName":"Purchasing & Procurement","positionTitle":"Purchasing & Procurement Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0018', 'NKB052026-0018', 'maximojr.ilano', 'MAXIMO JR.', 'ILANO', 'maximojr.ilano@nkb.com', '+63 900000017',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-018', '03-8899018-1', '12-094820192-1', '1210-9482-0192', '00117-44217-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"ILANO, MAXIMO JR.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0018","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-screenshot-6', 'NKB112026-0055', 'rex.ilano', 'REX', 'ILANO', 'rex@nkb.com', '+63 900000055',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"ILANO, REX","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB112026-0055","departmentName":"Production & Manufacturing","positionTitle":"Production Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0019', 'NKB052026-0019', 'gen', 'GENEVIEVE ANNE A.', 'JURADO', 'genevieveannea.jurado@nkb.com', '+63 900000018',
    'hr', 'regular', 'dept-hr', 'pos-hr', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-019', '03-8899019-1', '12-094820192-1', '1210-9482-0192', '00118-44218-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"JURADO, GENEVIEVE ANNE A.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0019","departmentName":"Human Resources Management","positionTitle":"HR Manager"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0015', 'PRJ2026-0015', 'jason.laungayan', 'JASON', 'LAUNGAYAN', 'jason.laungayan@nkb.com', '+63 900000064',
    'security', 'project_based', 'dept-sec', 'pos-sec', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-065', '03-8899065-1', '12-094820192-1', '1210-9482-0192', '00164-44264-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"LAUNGAYAN, JASON","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0015","departmentName":"Plant Security & Safety","positionTitle":"Plant Security & Safety Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0016', 'PRJ2026-0016', 'marivic.laungayan', 'MARIVIC', 'LAUNGAYAN', 'marivic.laungayan@nkb.com', '+63 900000065',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-066', '03-8899066-1', '12-094820192-1', '1210-9482-0192', '00165-44265-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"LAUNGAYAN, MARIVIC","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0016","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0020', 'NKB052026-0020', 'rodello.luy', 'RODELLO', 'LUY', 'rodello.luy@nkb.com', '+63 900000019',
    'employee', 'regular', 'dept-wh', 'pos-wh', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-020', '03-8899020-1', '12-094820192-1', '1210-9482-0192', '00119-44219-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"LUY, RODELLO","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0020","departmentName":"Inventory & Warehouse Logistics","positionTitle":"Inventory & Warehouse Logistics Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0021', 'NKB052026-0021', 'angelita.macafe', 'ANGELITA', 'MACAFE', 'angelita.macafe@nkb.com', '+63 900000020',
    'employee', 'regular', 'dept-rd', 'pos-rd', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-021', '03-8899021-1', '12-094820192-1', '1210-9482-0192', '00120-44220-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MACAFE, ANGELITA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0021","departmentName":"Research & Product Development","positionTitle":"Research & Product Development Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0017', 'PRJ2026-0017', 'vincent.macol', 'VINCENT', 'MACOL', 'vincent.macol@nkb.com', '+63 900000066',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-067', '03-8899067-1', '12-094820192-1', '1210-9482-0192', '00166-44266-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MACOL, VINCENT","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0017","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792379239063', 'PRJ-2026-0040', 'wilsonmacol', 'WILSON', 'MACOL', 'wilson@nkb.com', '+63 900000040',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"MACOL, WILSON","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0040"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0040', 'NKB052026-0040', 'edwin.madelo', 'EDWIN', 'MADELO', 'edwin.madelo@nkb.com', '+63 900000039',
    'accounting', 'regular', 'dept-fin', 'pos-fin', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-040', '03-8899040-1', '12-094820192-1', '1210-9482-0192', '00139-44239-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MADELO, EDWIN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0040","departmentName":"Finance & Accounting","positionTitle":"Accounting & Finance Officer"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0033', 'PRJ2026-0033', 'edmarjohn.magan', 'EDMAR JOHN', 'MAGAN', 'edmarjohn.magan@nkb.com', '+63 900000082',
    'employee', 'project_based', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-083', '03-8899083-1', '12-094820192-1', '1210-9482-0192', '00182-44282-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MAGAN, EDMAR JOHN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0033","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0018', 'PRJ2026-0018', 'melina.maglangit', 'MELINA', 'MAGLANGIT', 'melina.maglangit@nkb.com', '+63 900000067',
    'employee', 'project_based', 'dept-maint', 'pos-maint', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-068', '03-8899068-1', '12-094820192-1', '1210-9482-0192', '00167-44267-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MAGLANGIT, MELINA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0018","departmentName":"Plant Maintenance & Engineering","positionTitle":"Plant Maintenance & Engineering Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0034', 'PRJ2026-0034', 'elmediojr.mananquil', 'ELMEDIO JR.', 'MANANQUIL', 'elmediojr.mananquil@nkb.com', '+63 900000083',
    'employee', 'project_based', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-084', '03-8899084-1', '12-094820192-1', '1210-9482-0192', '00183-44283-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MANANQUIL, ELMEDIO JR.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0034","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0022', 'NKB052026-0022', 'markgleen.mananquil', 'MARK GLEEN', 'MANANQUIL', 'markgleen.mananquil@nkb.com', '+63 900000021',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-022', '03-8899022-1', '12-094820192-1', '1210-9482-0192', '00121-44221-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MANANQUIL, MARK GLEEN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0022","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0023', 'NKB052026-0023', 'anamariev.mangulabnan', 'ANA MARIE V.', 'MANGULABNAN', 'anamariev.mangulabnan@nkb.com', '+63 900000022',
    'employee', 'regular', 'dept-hk', 'pos-hk', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-023', '03-8899023-1', '12-094820192-1', '1210-9482-0192', '00122-44222-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MANGULABNAN, ANA MARIE V.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0023","departmentName":"Housekeeping & Sanitation","positionTitle":"Housekeeping & Sanitation Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0024', 'NKB052026-0024', 'canteenadmin', 'NANNETTE', 'MANUEL', 'canteen@nkb.com', '+63 900000023',
    'canteen', 'regular', 'dept-cant', 'pos-cant', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-024', '03-8899024-1', '12-094820192-1', '1210-9482-0192', '00123-44223-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MANUEL, NANNETTE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0024","departmentName":"Canteen & Food Services","positionTitle":"Canteen Administrator & Manager"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-vyu2026-0003', 'VYU2026-0003', 'melanied.marbibi', 'MELANIE D.', 'MARBIBI', 'melanied.marbibi@nkb.com', '+63 900000091',
    'employee', 'regular', 'dept-vyu', 'pos-vyu', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-092', '03-8899092-1', '12-094820192-1', '1210-9482-0192', '00191-44291-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MARBIBI, MELANIE D.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"VYU2026-0003","departmentName":"Vyuceutical Laboratories","positionTitle":"Vyuceutical Laboratories Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb092026-0047', 'NKB092026-0047', 'ephraemf.marfil', 'EPHRAEM F.', 'MARFIL', 'ephraemf.marfil@nkb.com', '+63 900000046',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-047', '03-8899047-1', '12-094820192-1', '1210-9482-0192', '00146-44246-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MARFIL, EPHRAEM F.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB092026-0047","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0025', 'NKB052026-0025', 'michelle.martin', 'MICHELLE', 'MARTIN', 'michelle.martin@nkb.com', '+63 900000024',
    'employee', 'regular', 'dept-biz', 'pos-biz', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-025', '03-8899025-1', '12-094820192-1', '1210-9482-0192', '00124-44224-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MARTIN, MICHELLE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0025","departmentName":"Business Development","positionTitle":"Business Development Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0019', 'PRJ2026-0019', 'roselyn.mejorada', 'ROSELYN', 'MEJORADA', 'roselyn.mejorada@nkb.com', '+63 900000068',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-069', '03-8899069-1', '12-094820192-1', '1210-9482-0192', '00168-44268-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MEJORADA, ROSELYN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0019","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0020', 'PRJ2026-0020', 'marife.mendoza', 'MARIFE', 'MENDOZA', 'marife.mendoza@nkb.com', '+63 900000069',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-070', '03-8899070-1', '12-094820192-1', '1210-9482-0192', '00169-44269-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MENDOZA, MARIFE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0020","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb072026-0043', 'NKB072026-0043', 'porchiasoffialouisse.mendoza', 'PORCHIA SOFFIA LOUISSE', 'MENDOZA', 'porchiasoffialouisse.mendoza@nkb.com', '+63 900000042',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-043', '03-8899043-1', '12-094820192-1', '1210-9482-0192', '00142-44242-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MENDOZA, PORCHIA SOFFIA LOUISSE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB072026-0043","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0026', 'NKB052026-0026', 'sonny.mendoza', 'SONNY', 'MENDOZA', 'sonny.mendoza@nkb.com', '+63 900000025',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-026', '03-8899026-1', '12-094820192-1', '1210-9482-0192', '00125-44225-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MENDOZA, SONNY","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0026","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0027', 'NKB052026-0027', 'jayceld.mercado', 'JAYCEL D.', 'MERCADO', 'jayceld.mercado@nkb.com', '+63 900000026',
    'employee', 'regular', 'dept-wh', 'pos-wh', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-027', '03-8899027-1', '12-094820192-1', '1210-9482-0192', '00126-44226-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MERCADO, JAYCEL D.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0027","departmentName":"Inventory & Warehouse Logistics","positionTitle":"Inventory & Warehouse Logistics Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0021', 'PRJ2026-0021', 'darius.mirambil', 'DARIUS', 'MIRAMBIL', 'darius.mirambil@nkb.com', '+63 900000070',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-071', '03-8899071-1', '12-094820192-1', '1210-9482-0192', '00170-44270-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, DARIUS","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0021","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0022', 'PRJ2026-0022', 'leo.mirambil', 'LEO', 'MIRAMBIL', 'leo.mirambil@nkb.com', '+63 900000071',
    'employee', 'project_based', 'dept-silk', 'pos-silk', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-072', '03-8899072-1', '12-094820192-1', '1210-9482-0192', '00171-44271-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, LEO","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0022","departmentName":"Silkscreen & Packaging Line","positionTitle":"Silkscreen & Packaging Line Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792393842340', 'PRJ-2026-0047', 'lmirambil', 'LEONARD', 'MIRAMBIL', 'nard@nkb.com', '+63 900000047',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"MIRAMBIL, LEONARD","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0047"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0023', 'PRJ2026-0023', 'michael.mirambil', 'MICHAEL', 'MIRAMBIL', 'michael.mirambil@nkb.com', '+63 900000072',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-073', '03-8899073-1', '12-094820192-1', '1210-9482-0192', '00172-44272-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, MICHAEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0023","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0038', 'PRJ2026-0038', 'monica.mirambil', 'MONICA', 'MIRAMBIL', 'monica.mirambil@nkb.com', '+63 900000087',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-088', '03-8899088-1', '12-094820192-1', '1210-9482-0192', '00187-44287-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, MONICA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0038","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0028', 'NKB052026-0028', 'rickyo.mirambil', 'RICKY O.', 'MIRAMBIL', 'rickyo.mirambil@nkb.com', '+63 900000027',
    'security', 'regular', 'dept-sec', 'pos-sec', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-028', '03-8899028-1', '12-094820192-1', '1210-9482-0192', '00127-44227-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, RICKY O.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0028","departmentName":"Plant Security & Safety","positionTitle":"Plant Security & Safety Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0029', 'NKB052026-0029', 'rommelm.mirambil', 'ROMMEL M.', 'MIRAMBIL', 'rommelm.mirambil@nkb.com', '+63 900000028',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-029', '03-8899029-1', '12-094820192-1', '1210-9482-0192', '00128-44228-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, ROMMEL M.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0029","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0030', 'NKB052026-0030', 'rosannao.mirambil', 'ROSANNA O.', 'MIRAMBIL', 'rosannao.mirambil@nkb.com', '+63 900000029',
    'employee', 'regular', 'dept-hk', 'pos-hk', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-030', '03-8899030-1', '12-094820192-1', '1210-9482-0192', '00129-44229-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MIRAMBIL, ROSANNA O.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0030","departmentName":"Housekeeping & Sanitation","positionTitle":"Housekeeping & Sanitation Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0031', 'NKB052026-0031', 'roseann.molina', 'ROSE ANN', 'MOLINA', 'roseann.molina@nkb.com', '+63 900000030',
    'employee', 'regular', 'dept-vyu', 'pos-vyu', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-031', '03-8899031-1', '12-094820192-1', '1210-9482-0192', '00130-44230-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"MOLINA, ROSE ANN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0031","departmentName":"Vyuceutical Laboratories","positionTitle":"Vyuceutical Laboratories Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0032', 'NKB052026-0032', 'dorina.nabong', 'DORINA', 'NABONG', 'dorina.nabong@nkb.com', '+63 900000031',
    'accounting', 'regular', 'dept-fin', 'pos-fin', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-032', '03-8899032-1', '12-094820192-1', '1210-9482-0192', '00131-44231-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"NABONG, DORINA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0032","departmentName":"Finance & Accounting","positionTitle":"Accounting & Finance Officer"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb072026-0042', 'NKB072026-0042', 'jillianamarieb.ngoho', 'JILLIANA MARIE B.', 'NGOHO', 'jillianamarieb.ngoho@nkb.com', '+63 900000041',
    'employee', 'regular', 'dept-reg', 'pos-reg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-042', '03-8899042-1', '12-094820192-1', '1210-9482-0192', '00141-44241-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"NGOHO, JILLIANA MARIE B.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB072026-0042","departmentName":"Regulatory Affairs & Compliance","positionTitle":"Regulatory Affairs & Compliance Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0033', 'NKB052026-0033', 'glennl.nobleza', 'GLENN L.', 'NOBLEZA', 'glennl.nobleza@nkb.com', '+63 900000032',
    'employee', 'regular', 'dept-maint', 'pos-maint', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-033', '03-8899033-1', '12-094820192-1', '1210-9482-0192', '00132-44232-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"NOBLEZA, GLENN L.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0033","departmentName":"Plant Maintenance & Engineering","positionTitle":"Plant Maintenance & Engineering Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0034', 'NKB052026-0034', 'rodaliag.obamos', 'RODALIA G.', 'OBAMOS', 'rodaliag.obamos@nkb.com', '+63 900000033',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-034', '03-8899034-1', '12-094820192-1', '1210-9482-0192', '00133-44233-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"OBAMOS, RODALIA G.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0034","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'staff-1792386661829', 'PRJ-2026-0043', 'jobuyez', 'JEMAR', 'OBUYES', 'jemar@nkb.cm', '+63 900000043',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-10-19',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '', '', '12-094820192-1', '1210-9482-0192', '',
    '', true, '{"rawName":"OBUYES, JEMAR","salaryRate":25000,"baseSalary":25000,"salaryRateType":"monthly","barcodeValue":"PRJ-2026-0043"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0024', 'PRJ2026-0024', 'jayson.omandac', 'JAYSON', 'OMANDAC', 'jayson.omandac@nkb.com', '+63 900000073',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-074', '03-8899074-1', '12-094820192-1', '1210-9482-0192', '00173-44273-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"OMANDAC, JAYSON","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0024","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0025', 'PRJ2026-0025', 'jocelyn.orongan', 'JOCELYN', 'ORONGAN', 'jocelyn.orongan@nkb.com', '+63 900000074',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-075', '03-8899075-1', '12-094820192-1', '1210-9482-0192', '00174-44274-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"ORONGAN, JOCELYN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0025","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0026', 'PRJ2026-0026', 'creiverjohn.padilla', 'CREIVER JOHN', 'PADILLA', 'creiverjohn.padilla@nkb.com', '+63 900000075',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-076', '03-8899076-1', '12-094820192-1', '1210-9482-0192', '00175-44275-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"PADILLA, CREIVER JOHN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0026","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0035', 'NKB052026-0035', 'priman.panis', 'PRIMAN', 'PANIS', 'priman.panis@nkb.com', '+63 900000034',
    'employee', 'regular', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-035', '03-8899035-1', '12-094820192-1', '1210-9482-0192', '00134-44234-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"PANIS, PRIMAN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0035","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb092026-0048', 'NKB092026-0048', 'carl', 'CARL LAURENCE B.', 'PATAGNAN', 'carllaurencepatagnan@gmail.com', '+63 9763107012',
    'it_admin', 'regular', 'dept-it', 'pos-it', '2026-09-07',
    '2004-01-28', 'Lot 96, Blk 13, Phase 1, Decca Homes, Meycauayan, Bulacan', '100-200-048', '03-8899048-1', '12-094820192-1', '1210-9482-0192', '00147-44247-11',
    'data:image/jpeg;base64,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WX19+lTzzSX20KtUQBGXUoUKEnMzeU79+6nn488vTvSdUpAEMmtQUUI4TJw79enHlzJ116auS2rABGTWoKFJJDjLyvV55h3xt0eQ6AARk10CgpOUM3lHqccXrz9fo9eEcX1AAjJroFBSSQ88t56s5t8+9/pc8c83v0oAjJsAKASSPX507g5463enXl5JA69egQZNdAUAk5jTnxVyk63ehmghTr06qBk1qBQDnyGi5sqRdvpWflBKr26pAyaygoDz84rvRznyxdfpb4+cIDr26KJGXWKFA58UF0p45Zp95efCCEX37CiTLrCiiJPJzR6+078735GfkQHt3QCXJrBSkhz5yFXT7d831uHNzCA9PUUErJrAqpBPGAvXt36+vrlwcxAOvcKELk1gUgHjylF9fTZ7ePzfIQF96UEDLrAsATz4Itnfru9vl54ID27KSwDLrASgieAUe27z+fBAenqFlgDLrAigR4QKemzJ4iA69wKiwMusEVKEceQU678UAX3oLBYGXVQgKIZwURAHt2AFgMuopAKI8uApCWB6eoAAWZdQsAURPAKSWA69wAAGTWssAKQ8ZBXIB79AAATLrogAonHkC8gl9fQAABM2qkllAUjwgICd+4AABM2qkllAKjz8xZEo9+gAACZtSpLKAKk8YWQL36gAAEuXUqSygAJzxzXJe++gAABLl1VEsoAAc8czr06AAABFy6yJZQLAAigAACUi5dQipQAALAAABKSsuoRUoLABVkAAAJUVl1CKlBYAL4e3XIAABKisuoRUULACzJo9eQAACVKZdQSooLACxYAAASxTLqCVFBYAdcdQAAASxTLqAJQWAFIAAAJZRl1AEULAAAAABCjLrgCKKgAAAAAhRl1AEUVALAAAAEUMuoAShYBUAAABChl1ACULAAAAACFDLqAEoACwAAAEKGXUAJQsAqAAEoCKDLqAEoAAAAJQEUGXUAIoAAAAACKDLqACUAAAAABFBl1ACKAAAAAAigy6gBFAAAAAARQZdQAigAAAAAIoMuoARQAAABKASgZdQAigAAACUAlAy6gCCgAAAIoCKBl1ACKAAAAJQEUDLqAIKCUAABKAigZdQBBQAAAEUEsUDLqAIKCUAAEsoJYoGXUAQUEsoAARQIUDLqAIKCKAACUBBQZdQBAoRQABLKBBQMuoAgUJZQAAlBLCgZdQCAUQoACC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i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2G7i2Hs974thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4th/f/2gAIAQMTAz8Cuothu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4thu4th7j+PZFsPcB2xbDdxbDdxbDWe/eLYa736xbDdxbDZf8+MWw8fn73g8+nv7z5RbDxecXvz9/efOLYa/wA+kWw8P8Pw/tFFsPD/AA1UWw0Pvz9+8Ww8X9+PvD594th7/OyLYeL0fX3si2Hj85veKLYanzii2G7i2G7i2Gm95YthpvOWLYbuLYaT3ni2Gk854thu4thu4thu4thu4thu4thu4th6/P8APe6LYewj39/e6LYe3+90Ww3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw3cWw/v/8QAMBAAAgECBAQGAwEBAAIDAAAAAAERECEgMUFRMEBhcVBggZGh8LHB0eHxcICQoLD/2gAIAQEAAz8h/wD1HULzw+4n5y9KtebJxJ6CFv8ABsG69aRrPAfmOKruboFuTqYqdx1jzPF8LojcXybF3NlC1HWabsiMiaQNxb9G4nJmTXYaET5c2uRmMlxAns9BLMSNhrQ3Ql0NRmhkOxue1LjygyMUTsahRMCam5by49cjIkPUSIotzqjoj1cjcJbiFtJJOCEIi2heGyOZuIzNiXBGXlmKuifQ2aIztRrJ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', true, '{"rawName":"PATAGNAN, CARL LAURENCE B.","salaryRate":600,"baseSalary":15600,"salaryRateType":"daily","barcodeValue":"NKB092026-0048","departmentName":"Information Technology (IT)","positionTitle":"IT Systems Administrator"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb082026-0045', 'NKB082026-0045', 'mavickpauleenroma.pellazar', 'MAVICK PAULEEN ROMA', 'PELLAZAR', 'mavickpauleenroma.pellazar@nkb.com', '+63 900000044',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-045', '03-8899045-1', '12-094820192-1', '1210-9482-0192', '00144-44244-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"PELLAZAR, MAVICK PAULEEN ROMA","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB082026-0045","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkbpettycash', 'NKBPETTYCASH', 'pettycash', 'PETTY CASH', 'Member', 'pettycash@nkb.com', '+63 900000049',
    'accounting', 'regular', 'dept-fin', 'pos-fin', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-050', '03-8899050-1', '12-094820192-1', '1210-9482-0192', '00149-44249-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"PETTY CASH","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKBPETTYCASH","departmentName":"Finance & Accounting","positionTitle":"Accounting & Finance Officer"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0027', 'PRJ2026-0027', 'jaysieg.presentacion', 'JAYSIE G.', 'PRESENTACION', 'jaysieg.presentacion@nkb.com', '+63 900000076',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-077', '03-8899077-1', '12-094820192-1', '1210-9482-0192', '00176-44276-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"PRESENTACION, JAYSIE G.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0027","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0036', 'NKB052026-0036', 'ronaldo.pridencio', 'RONALDO', 'PRIDENCIO', 'ronaldo.pridencio@nkb.com', '+63 900000035',
    'employee', 'regular', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-036', '03-8899036-1', '12-094820192-1', '1210-9482-0192', '00135-44235-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"PRIDENCIO, RONALDO","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0036","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0037', 'NKB052026-0037', 'dennisr.razo', 'DENNIS R.', 'RAZO', 'dennisr.razo@nkb.com', '+63 900000036',
    'accounting', 'regular', 'dept-fin', 'pos-fin', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-037', '03-8899037-1', '12-094820192-1', '1210-9482-0192', '00136-44236-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"RAZO, DENNIS R.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0037","departmentName":"Finance & Accounting","positionTitle":"Accounting & Finance Officer"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0028', 'PRJ2026-0028', 'ronald.regala', 'RONALD', 'REGALA', 'ronald.regala@nkb.com', '+63 900000077',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-078', '03-8899078-1', '12-094820192-1', '1210-9482-0192', '00177-44277-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"REGALA, RONALD","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0028","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-vyu2026-0002', 'VYU2026-0002', 'justine.rocero', 'JUSTINE', 'ROCERO', 'justine.rocero@nkb.com', '+63 900000090',
    'employee', 'regular', 'dept-vyu', 'pos-vyu', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-091', '03-8899091-1', '12-094820192-1', '1210-9482-0192', '00190-44290-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"ROCERO, JUSTINE","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"VYU2026-0002","departmentName":"Vyuceutical Laboratories","positionTitle":"Vyuceutical Laboratories Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0037', 'PRJ2026-0037', 'anao.salcedo', 'ANA O.', 'SALCEDO', 'anao.salcedo@nkb.com', '+63 900000086',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-087', '03-8899087-1', '12-094820192-1', '1210-9482-0192', '00186-44286-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"SALCEDO, ANA O.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0037","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0038', 'NKB052026-0038', 'sharmainee.santos', 'SHARMAINE E.', 'SANTOS', 'sharmainee.santos@nkb.com', '+63 900000037',
    'accounting', 'regular', 'dept-fin', 'pos-fin', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-038', '03-8899038-1', '12-094820192-1', '1210-9482-0192', '00137-44237-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"SANTOS, SHARMAINE E.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0038","departmentName":"Finance & Accounting","positionTitle":"Accounting & Finance Officer"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0029', 'PRJ2026-0029', 'joel.soriano', 'JOEL', 'SORIANO', 'joel.soriano@nkb.com', '+63 900000078',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-079', '03-8899079-1', '12-094820192-1', '1210-9482-0192', '00178-44278-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"SORIANO, JOEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0029","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0030', 'PRJ2026-0030', 'joylen.soriano', 'JOYLEN', 'SORIANO', 'joylen.soriano@nkb.com', '+63 900000079',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-080', '03-8899080-1', '12-094820192-1', '1210-9482-0192', '00179-44279-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"SORIANO, JOYLEN","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0030","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb072026-0044', 'NKB072026-0044', 'angelicat.taguan', 'ANGELICA T.', 'TAGUAN', 'angelicat.taguan@nkb.com', '+63 900000043',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-044', '03-8899044-1', '12-094820192-1', '1210-9482-0192', '00143-44243-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"TAGUAN, ANGELICA T.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB072026-0044","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0035', 'PRJ2026-0035', 'michael.taruc', 'MICHAEL', 'TARUC', 'michael.taruc@nkb.com', '+63 900000084',
    'employee', 'project_based', 'dept-const', 'pos-const', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-085', '03-8899085-1', '12-094820192-1', '1210-9482-0192', '00184-44284-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"TARUC, MICHAEL","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0035","departmentName":"Plant Construction & Facilities","positionTitle":"Plant Construction & Facilities Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-nkb052026-0039', 'NKB052026-0039', 'reynanp.valiao', 'REYNAN P.', 'VALIAO', 'reynanp.valiao@nkb.com', '+63 900000038',
    'employee', 'regular', 'dept-mktg', 'pos-mktg', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-039', '03-8899039-1', '12-094820192-1', '1210-9482-0192', '00138-44238-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"VALIAO, REYNAN P.","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"NKB052026-0039","departmentName":"Marketing & Brand Strategy","positionTitle":"Marketing & Brand Strategy Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();
INSERT INTO staff (
    id, employee_id, username, first_name, last_name, email, phone,
    role, employment_type, department_id, position_id, hire_date,
    birth_date, address, tin, sss, philhealth, pagibig, bank_account,
    avatar_url, is_active, metadata, updated_at
  ) VALUES (
    'emp-prj2026-0031', 'PRJ2026-0031', 'leonard.valle', 'LEONARD', 'VALLE', 'leonard.valle@nkb.com', '+63 900000080',
    'employee', 'project_based', 'dept-prod', 'pos-prod', '2026-05-01',
    '1995-06-15', 'Subic Bay Gateway Park, Olongapo City, Zambales', '100-200-081', '03-8899081-1', '12-094820192-1', '1210-9482-0192', '00180-44280-11',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, '{"rawName":"VALLE, LEONARD","salaryRate":20000,"baseSalary":20000,"salaryRateType":"monthly","barcodeValue":"PRJ2026-0031","departmentName":"Production & Manufacturing","positionTitle":"Production & Manufacturing Specialist"}'::jsonb, NOW()
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
    updated_at = NOW();

COMMIT;
