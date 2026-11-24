-- Clean up duplicate staff and service accounts
BEGIN;

-- 1. Remove duplicate Ilano Rex (NKB112026-0055)
DELETE FROM staff WHERE employee_id = 'NKB112026-0055' OR id = 'emp-screenshot-6';

-- 2. Remove service accounts from employee table
DELETE FROM staff WHERE employee_id IN ('NKBCANTEEN', 'NKBPETTYCASH') OR id IN ('emp-nkbcanteen', 'emp-nkbpettycash');

-- 3. Update Rex Ilano (NKB052026-0018)
UPDATE staff SET 
  first_name = 'REX', 
  last_name = 'ILANO', 
  metadata = metadata || '{"rawName": "ILANO, REX"}'::jsonb,
  updated_at = NOW()
WHERE employee_id = 'NKB052026-0018';

-- 4. Standardize official names matching company records
UPDATE staff SET first_name = 'JIALYN', last_name = 'AMOLO', metadata = metadata || '{"rawName": "AMOLO, JIALYN"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0001';
UPDATE staff SET first_name = 'RAFAEL RONLE I.', last_name = 'BOMBITA', metadata = metadata || '{"rawName": "BOMBITA, RAFAEL RONLE I."}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0002';
UPDATE staff SET first_name = 'RANIELLA CAMILLE I.', last_name = 'BOMBITA', metadata = metadata || '{"rawName": "BOMBITA, RANIELLA CAMILLE I."}'::jsonb, updated_at = NOW() WHERE employee_id = 'NKB052026-0007';
UPDATE staff SET first_name = 'PAULINE', last_name = 'CAMAÑA', metadata = metadata || '{"rawName": "CAMAÑA, PAULINE"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0003';
UPDATE staff SET first_name = 'CARLO', last_name = 'CAREL', metadata = metadata || '{"rawName": "CAREL, CARLO"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0004';
UPDATE staff SET first_name = 'DOMINIC', last_name = 'CATE', metadata = metadata || '{"rawName": "CATE, DOMINIC"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0005';
UPDATE staff SET first_name = 'RENAR A.', last_name = 'CATINDIG', metadata = metadata || '{"rawName": "CATINDIG, RENAR A. (2)"}'::jsonb, updated_at = NOW() WHERE employee_id = 'NKB052026-0010';
UPDATE staff SET first_name = 'MARY ANNE', last_name = 'DEL ROSARIO', metadata = metadata || '{"rawName": "DEL ROSARIO, MARY ANNE"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0010';
UPDATE staff SET first_name = 'MARY GRACE', last_name = 'DEL SOCORRO', metadata = metadata || '{"rawName": "DEL SOCORRO, MARY GRACE"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0011';
UPDATE staff SET first_name = 'LLOYD', last_name = 'DELA CRUZ', metadata = metadata || '{"rawName": "DELA CRUZ, LLOYD"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0012';
UPDATE staff SET first_name = 'JONNEL', last_name = 'GARCIA', metadata = metadata || '{"rawName": "GARCIA, JONNEL"}'::jsonb, updated_at = NOW() WHERE employee_id = 'NKB052026-0041';
UPDATE staff SET first_name = 'RAQUEL', last_name = 'GUERRERO', metadata = metadata || '{"rawName": "GUERRERO, RAQUEL"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0014';
UPDATE staff SET first_name = 'JAIME', last_name = 'GUILLERMO', metadata = metadata || '{"rawName": "GUILLERMO, JAIME"}'::jsonb, updated_at = NOW() WHERE employee_id = 'NKB052026-0016';
UPDATE staff SET first_name = 'ISAGANI', last_name = 'GUILLERMO', metadata = metadata || '{"rawName": "GUILLERMO, ISAGANI"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0036';
UPDATE staff SET first_name = 'JASON', last_name = 'LAANGYAN', metadata = metadata || '{"rawName": "LAANGYAN, JASON"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0015';
UPDATE staff SET first_name = 'VARIVIC', last_name = 'LAANGYAN', metadata = metadata || '{"rawName": "LAANGYAN, VARIVIC"}'::jsonb, updated_at = NOW() WHERE employee_id = 'PRJ2026-0016';

COMMIT;
