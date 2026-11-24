#!/bin/bash
set -e

# Get current setup token from portainer logs
TOKEN=$(docker logs portainer 2>&1 | grep "setup_token=" | tail -n 1 | cut -d '=' -f 2)
echo "Using setup token: $TOKEN"

cat << 'EOF' > /tmp/portainer_init.json
{"Username":"admin","Password":"NkbManufacturing@2025"}
EOF

echo "Init payload:"
cat /tmp/portainer_init.json
echo ""

RESP=$(curl -sS -X POST http://127.0.0.1:9000/api/users/admin/init \
  -H "Content-Type: application/json" \
  -H "X-Setup-Token: $TOKEN" \
  --data @/tmp/portainer_init.json)

echo "Response from Portainer:"
echo "$RESP"

# Remove temporary file
rm -f /tmp/portainer_init.json

# Check if admin user is now initialized
curl -sS http://127.0.0.1:9000/api/users/admin/check
echo ""
