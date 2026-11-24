#!/usr/bin/env python3
"""
Sync real stock counts, minimum stock, pieces per pack, and retail piece prices
from the official backup masterlist (NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json)
into PostgreSQL canteen_inventory on the live VPS.
"""

import os
import sys
import json
import paramiko

VPS_HOST = "187.77.143.211"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASSWORD = os.environ.get("VPS_PASSWORD", "NkbManufacturing@2025")

BACKUP_FILE = os.path.join(os.path.dirname(__file__), "..", "NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json")

if not os.path.isfile(BACKUP_FILE):
    print(f"[ERROR] Backup file not found: {BACKUP_FILE}")
    sys.exit(1)

with open(BACKUP_FILE, "r", encoding="utf-8") as f:
    backup_data = json.load(f)

raw_inv = backup_data.get("data", {}).get("nkb_canteen_inventory")
if isinstance(raw_inv, str):
    raw_inv = json.loads(raw_inv)

print(f"Loaded {len(raw_inv)} inventory records from backup.")

sql_commands = ["BEGIN;"]
for it in raw_inv:
    it_id = it.get("id", "").replace("'", "''")
    qty = int(it.get("quantity") or 0)
    reorder = int(it.get("reorderLevel") or 10)
    pieces = int(it.get("piecesPerPack") or 1)
    piece_price = float(it.get("retailPiecePrice") or 0)
    is_box = "TRUE" if (it.get("hasRetailPiece") or it.get("pieceBarcode") or piece_price > 0) else "FALSE"
    
    sql_commands.append(
        f"UPDATE canteen_inventory SET current_stock = {qty}, minimum_stock = {reorder}, pieces_per_box = {pieces}, piece_selling_price = {piece_price:.2f}, is_box_item = {is_box} WHERE id = '{it_id}';"
    )

sql_commands.append("COMMIT;")
full_sql = "\n".join(sql_commands)

# Save local SQL file
sql_file_path = os.path.join(os.path.dirname(__file__), "sync_inventory_stocks.sql")
with open(sql_file_path, "w", encoding="utf-8") as f:
    f.write(full_sql)

print(f"Generated SQL script with {len(raw_inv)} updates. ({len(full_sql)} bytes)")

# Connect to VPS and execute inside nkb_mfg_postgres
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to VPS {VPS_USER}@{VPS_HOST}...")
    client.connect(
        hostname=VPS_HOST,
        port=VPS_PORT,
        username=VPS_USER,
        password=VPS_PASSWORD,
        timeout=15,
        look_for_keys=False,
        allow_agent=False
    )
    print("[SSH CONNECTED] Transferring and applying stock sync SQL...")

    sftp = client.open_sftp()
    remote_sql_path = "/tmp/sync_inventory_stocks.sql"
    sftp.put(sql_file_path, remote_sql_path)
    sftp.close()

    # Execute SQL inside nkb_mfg_postgres container
    exec_cmd = f"docker exec -i nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db < {remote_sql_path} && rm -f {remote_sql_path}"
    stdin, stdout, stderr = client.exec_command(exec_cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()

    if code != 0:
        print(f"[SQL ERROR] {err}")
        sys.exit(code)

    print("[SUCCESS] SQL executed successfully.")

    # Verification query
    verify_cmd = """docker exec -i nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -c "
    SELECT 
        count(*) as total_items, 
        count(*) filter (where current_stock > 0) as items_in_stock,
        count(*) filter (where current_stock = 0) as items_out_of_stock,
        sum(current_stock) as total_units_in_stock
    FROM canteen_inventory;
    " """
    stdin, stdout, stderr = client.exec_command(verify_cmd)
    print(stdout.read().decode("utf-8", errors="replace"))

    # Sample query for Tuna items
    tuna_cmd = """docker exec -i nkb_mfg_postgres psql -U nkb_user -d nkb_scanner_db -c "
    SELECT name, current_stock, minimum_stock, selling_price FROM canteen_inventory WHERE name ILIKE '%tuna%' ORDER BY name LIMIT 6;
    " """
    stdin, stdout, stderr = client.exec_command(tuna_cmd)
    print(stdout.read().decode("utf-8", errors="replace"))

finally:
    client.close()
