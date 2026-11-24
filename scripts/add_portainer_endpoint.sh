#!/bin/bash
set -e

cat << 'EOF' > /tmp/login.json
{"Username":"admin","Password":"NkbManufacturing@2025"}
EOF

TOKEN_JSON=$(curl -sS -X POST http://127.0.0.1:9000/api/auth \
  -H "Content-Type: application/json" \
  --data @/tmp/login.json)
rm -f /tmp/login.json

JWT=$(echo "$TOKEN_JSON" | grep -o '"jwt":"[^"]*' | cut -d '"' -f 4)

echo "=== Connected Endpoints ==="
curl -sS http://127.0.0.1:9000/api/endpoints -H "Authorization: Bearer $JWT" | jq -r '.[] | "\(.Id) - \(.Name) - \(.URL) - Status: \(.Status)"' 2>/dev/null || curl -sS http://127.0.0.1:9000/api/endpoints -H "Authorization: Bearer $JWT"

echo ""
echo "=== Containers Detected by Portainer ==="
curl -sS http://127.0.0.1:9000/api/endpoints/1/docker/containers/json?all=1 -H "Authorization: Bearer $JWT" | grep -o '"Names":\["[^"]*"\]'
