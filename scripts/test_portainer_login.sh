#!/bin/bash
set -e

cat << 'EOF' > /tmp/login.json
{"Username":"admin","Password":"NkbManufacturing@2025"}
EOF

TOKEN_JSON=$(curl -sS -X POST http://127.0.0.1:9000/api/auth \
  -H "Content-Type: application/json" \
  --data @/tmp/login.json)

rm -f /tmp/login.json

echo "Portainer Auth Response:"
echo "$TOKEN_JSON" | grep -o '"jwt":[^,]*' || echo "$TOKEN_JSON"

JWT=$(echo "$TOKEN_JSON" | grep -o '"jwt":"[^"]*' | cut -d '"' -f 4)

if [ -n "$JWT" ]; then
  echo "SUCCESS: Authenticated to Portainer!"
  echo "Endpoints in Portainer:"
  curl -sS http://127.0.0.1:9000/api/endpoints -H "Authorization: Bearer $JWT"
fi
