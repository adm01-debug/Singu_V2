#!/usr/bin/env bash
# Importa auth.identities no destino. Idempotente (ON CONFLICT DO NOTHING).
set -euo pipefail
: "${DEST_DB_URL:?defina DEST_DB_URL}"
IN="${IN:-./auth-identities.csv}"
[[ -f "$IN" ]] || { echo "✖ $IN não encontrado"; exit 2; }

psql "$DEST_DB_URL" <<SQL
BEGIN;
CREATE TEMP TABLE _idents (LIKE auth.identities INCLUDING DEFAULTS);
\COPY _idents (id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at, email, provider_id) FROM '$IN' WITH CSV HEADER;
INSERT INTO auth.identities
SELECT * FROM _idents
ON CONFLICT (provider, provider_id) DO NOTHING;
SELECT count(*) AS importadas FROM _idents;
COMMIT;
SQL
echo "✔ Import concluído."
