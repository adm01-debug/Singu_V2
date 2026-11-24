#!/usr/bin/env bash
set -u
FAKE=00000000-0000-0000-0000-000000000000
probe() {
  local label="$1"; local body="$2"
  local code
  code=$(curl -sS -o /tmp/o.json -w '%{http_code}' -X POST "$SUPABASE_URL/functions/v1/external-data" \
    -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" -d "$body")
  printf '%s -> http=%s body=%s\n' "$label" "$code" "$(head -c 220 /tmp/o.json)"
}
probe E "{\"action\":\"insert\",\"table\":\"contact_phones\",\"record\":{\"contact_id\":\"$FAKE\",\"phone\":\"+5511999999999\"}}"
probe F "{\"action\":\"insert\",\"table\":\"contact_emails\",\"record\":{\"contact_id\":\"$FAKE\",\"email\":\"x@example.invalid\"}}"
probe G "{\"action\":\"update\",\"table\":\"contact_emails\",\"id\":\"$FAKE\",\"version\":1,\"updates\":{\"email\":\"y@example.invalid\"}}"
sleep 4
echo "=== audit log ultimos 15 min ==="
psql -X -q -c "SELECT table_name, operation, outcome, left(coalesce(payload::text,''),100) AS payload, created_at FROM public.external_data_audit_log WHERE created_at > now() - interval '15 minutes' ORDER BY created_at DESC LIMIT 10"
echo "=== total de linhas na tabela ==="
psql -X -q -At -c "SELECT count(*) FROM public.external_data_audit_log"
