const xlsx = require('xlsx');
const fs = require('fs');

const wb = xlsx.readFile('./src/data/Employee Masterlist.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

const deptMap = {
  'CEO': { id: 'dept-exec', name: 'Executive Leadership (CEO)', code: 'EXEC', manager: 'Katherine A. BELLA' },
  'COO': { id: 'dept-coo', name: 'Operations Executive (COO)', code: 'COO', manager: 'Norvin L. BELLA' },
  'Production': { id: 'dept-prod', name: 'Production & Manufacturing', code: 'PROD', manager: 'Merry Jean I. ALONZO' },
  'Security': { id: 'dept-sec', name: 'Plant Security & Safety', code: 'SEC', manager: 'Marvin G. ATAYDE' },
  'Regulatory': { id: 'dept-reg', name: 'Regulatory Affairs & Compliance', code: 'REG', manager: 'Kem Mariel BOSTON' },
  'Compounding': { id: 'dept-comp', name: 'Compounding & Formulation', code: 'COMP', manager: 'Renar A. CATINDIG' },
  'Maintenance': { id: 'dept-maint', name: 'Plant Maintenance & Engineering', code: 'MAINT', manager: 'Glenn L. NOBLEZA' },
  'Construction': { id: 'dept-const', name: 'Plant Construction & Facilities', code: 'CONST', manager: 'Roberto CUYA' },
  'Inventory / Warehouse': { id: 'dept-wh', name: 'Inventory & Warehouse Logistics', code: 'WH', manager: 'Earl John DELOS SANTOS' },
  'Purchasing': { id: 'dept-purch', name: 'Purchasing & Procurement', code: 'PURCH', manager: 'Heramae GUTIERREZ' },
  'Marketing': { id: 'dept-mktg', name: 'Marketing & Brand Strategy', code: 'MKTG', manager: 'Maximo ILANO Jr.' },
  'HR': { id: 'dept-hr', name: 'Human Resources Management', code: 'HR', manager: 'Genevieve Anne A. JURADO' },
  'R&D': { id: 'dept-rd', name: 'Research & Product Development', code: 'RD', manager: 'Angelita MACAFE' },
  'Housekeeping': { id: 'dept-hk', name: 'Housekeeping & Sanitation', code: 'HK', manager: 'Ana Marie V. MANGULABNAN' },
  'Coop': { id: 'dept-coop', name: 'Cooperative Committee', code: 'COOP', manager: 'Nannette MANUEL' },
  'Business Development': { id: 'dept-biz', name: 'Business Development', code: 'BIZ', manager: 'Michelle MARTIN' },
  'Vyuceutical': { id: 'dept-vyu', name: 'Vyuceutical Laboratories', code: 'VYU', manager: 'Monet BOSTON' },
  'Accounting': { id: 'dept-fin', name: 'Finance & Accounting', code: 'FIN', manager: 'Dorina NABONG' },
  'Logistics': { id: 'dept-log', name: 'Fleet & Dispatch Logistics', code: 'LOG', manager: 'Jonnel GACIA' },
  'QC': { id: 'dept-qc', name: 'Quality Control (QC)', code: 'QC', manager: 'Marilou FABIO' },
  'Silkscreen': { id: 'dept-silk', name: 'Silkscreen & Packaging Line', code: 'SILK', manager: 'Leo MIRAMBIL' },
  'Canteen': { id: 'dept-cant', name: 'Canteen & Food Services', code: 'CANT', manager: 'Earl John DELOS SANTOS' },
  'IT': { id: 'dept-it', name: 'Information Technology (IT)', code: 'IT', manager: 'Carl Laurence B. PATAGNAN' }
};

const departments = Object.values(deptMap);

function parseName(raw) {
  if (!raw) return { first: 'Staff', last: 'Member' };
  if (raw.includes(',')) {
    const parts = raw.split(',').map(s => s.trim());
    return { first: parts[1] || 'Staff', last: parts[0] || 'Member' };
  }
  return { first: raw.trim(), last: '' };
}

function makeEmail(first, last, empId) {
  const cleanF = first.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanL = last.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanL) return (cleanF || 'staff') + '@nkb.com';
  return cleanF + '.' + cleanL + '@nkb.com';
}

function determineRole(dept, empId, name) {
  if (empId === 'NKB092026-0048' || name.toLowerCase().includes('patagnan')) return 'it_admin';
  if (dept === 'CEO' || empId === 'NKB052026-0001') return 'ceo';
  if (dept === 'COO' || empId === 'NKB052026-0002') return 'admin';
  if (dept === 'HR' || empId === 'NKB052026-0019') return 'hr';
  if (dept === 'Accounting' || empId === 'NKB052026-0032') return 'accounting';
  if (empId === 'NKBCANTEEN' || name.toLowerCase().includes('canteen')) return 'canteen';
  if (dept === 'Security') return 'security';
  return 'employee';
}

const staff = rows.map((r, idx) => {
  const { first, last } = parseName(r.name);
  const empId = (r.employee_id || ('EMP-2026-' + String(idx + 1).padStart(4, '0'))).trim();
  const rawDept = r.department ? r.department.trim() : (empId === 'NKBCANTEEN' ? 'Canteen' : 'Accounting');
  const isCarl = empId === 'NKB092026-0048' || (r.name && r.name.toLowerCase().includes('patagnan'));
  const effectiveDept = isCarl ? 'IT' : rawDept;
  const deptMeta = deptMap[effectiveDept] || deptMap['Production'];
  const role = determineRole(effectiveDept, empId, r.name || '');

  return {
    id: 'emp-' + empId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    employeeId: empId,
    barcodeValue: empId,
    employmentType: empId.startsWith('PRJ') ? 'project' : 'regular',
    firstName: first,
    lastName: last,
    rawName: r.name ? r.name.trim() : first + ' ' + last,
    email: makeEmail(first, last, empId),
    phone: '+63 9' + String(100000000 + idx).slice(1),
    positionId: 'pos-' + deptMeta.code.toLowerCase(),
    positionTitle: isCarl ? 'IT Systems Administrator' :
                   rawDept === 'CEO' ? 'Chief Executive Officer (CEO)' :
                   rawDept === 'COO' ? 'Chief Operating Officer (COO)' :
                   rawDept === 'HR' ? 'HR Manager' :
                   rawDept === 'Accounting' ? 'Accounting & Finance Officer' :
                   empId === 'NKBCANTEEN' ? 'Canteen Hub Manager' :
                   empId === 'NKBPETTYCASH' ? 'Petty Cash Custodian' :
                   deptMeta.name + ' Specialist',
    departmentId: deptMeta.id,
    departmentName: deptMeta.name,
    role: role,
    hireDate: '2026-05-01',
    baseSalary: 0, // All salary set to 0 as instructed
    payFrequency: 'semi-monthly',
    bankName: 'BDO Unibank',
    bankAccount: '00' + String(100 + idx) + '-44' + String(200 + idx) + '-11',
    tin: '100-200-' + String(idx + 1).padStart(3, '0'),
    sssNo: '03-8899' + String(idx + 1).padStart(3, '0') + '-1',
    pin: '12345678',
    status: r.status === 'active' ? 'active' : 'inactive',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  };
});

fs.writeFileSync('./src/data/generatedStaff.json', JSON.stringify({ departments, staff }, null, 2), 'utf8');
console.log('Saved generatedStaff.json with', staff.length, 'staff (all salary = 0) and', departments.length, 'departments.');
