const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const receipts = JSON.parse(backup.data.nkb_canteen_receipts || '[]');

console.log('--- RECEIPT 1160 ---');
console.log(JSON.stringify(receipts[1160], null, 2));

console.log('--- RECEIPT 1163 ---');
console.log(JSON.stringify(receipts[1163], null, 2));
