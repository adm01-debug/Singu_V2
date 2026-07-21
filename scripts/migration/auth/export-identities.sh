#!/usr/bin/env bash
# Exporta auth.identities (provedores OAuth linkados aos usuários).
# Uso: SRC_DB_URL=... ./export-identities.sh
set -euo pipefail
: "${SRC_DB_URL:?defina SRC_DB_URL}"
OUT="${OUT:-./auth-identities.csv}"
psql "$SRC_DB_URL" -c "\COPY (
  SELECT id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at, email, provider_id
  FROM auth.identities ORDER BY created_at
) TO STDOUT WITH CSV HEADER" > "$OUT"
echo "✔ Exportado $(wc -l < "$OUT") linhas → $OUT"
