const fs = require('fs');
const { execSync } = require('child_process');

// 1. Read SQL Dump
const content = fs.readFileSync('tests/staging_migrated_export_20261105.sql', 'utf8');
const lines = content.split(/\r?\n/);
let currentTable = null;
let dumpCounts = {};

for (let line of lines) {
  if (line.startsWith('COPY public.')) {
    currentTable = line.split(' ')[1].replace('public.', '').split('(')[0];
    dumpCounts[currentTable] = 0;
  } else if (line.trim() === '\\.' && currentTable) {
    currentTable = null;
  } else if (currentTable && line.length > 0) {
    dumpCounts[currentTable]++;
  }
}

// 2. Query Live PostgreSQL
const psqlOut = execSync('docker exec -i nkb_mfg_staging_postgres psql -U nkb_user -d nkb_scanner_db -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' AND table_type=\'BASE TABLE\' ORDER BY table_name;"', { encoding: 'utf8' });
const tables = psqlOut.trim().split(/\r?\n/).map(t => t.trim()).filter(Boolean);

let dbCounts = {};
for (const t of tables) {
  const countStr = execSync(`docker exec -i nkb_mfg_staging_postgres psql -U nkb_user -d nkb_scanner_db -t -c "SELECT count(*) FROM ${t};"`, { encoding: 'utf8' }).trim();
  dbCounts[t] = parseInt(countStr, 10);
}

console.log('| # | Table Name | Live PostgreSQL DB | SQL Export (Dump) | Difference |');
console.log('|---|---|---|---|---|');
let totalDb = 0;
let totalDump = 0;
let idx = 1;
for (const t of tables) {
  const cDb = dbCounts[t] || 0;
  const cDump = dumpCounts[t] || 0;
  totalDb += cDb;
  totalDump += cDump;
  console.log(`| ${String(idx++).padStart(2)} | ${t.padEnd(32)} | ${String(cDb).padStart(8)} | ${String(cDump).padStart(8)} | ${cDb === cDump ? 'EXACT MATCH' : 'MISMATCH'} |`);
}
console.log(`| **TOTAL** | **20 Tables** | **${totalDb}** | **${totalDump}** | **${totalDb === totalDump ? 'EXACT 100% MATCH' : 'MISMATCH'}** |`);
