#!/usr/bin/env bash
# Import paralelo por camadas topológicas.
# table-order.sql tem "-- table: public.<name>" um por linha em ordem topológica.
# Detectamos "camadas" via marcador "-- layer: N" (opcional); sem marcador cai em serial.
set -euo pipefail
: "${DEST_DB_URL:?defina DEST_DB_URL}"
: "${DATA_DIR:?defina DATA_DIR com os .csv exportados}"
PARALLEL="${PARALLEL:-4}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ Desabilitando triggers de FK/RLS durante o load"
psql "$DEST_DB_URL" -c "SET session_replication_role = replica;" >/dev/null

# Extrai camadas
LAYERS=$(awk '/-- layer:/ {layer=$3} /-- table: public\./ {print layer"|"$3}' "$SCRIPT_DIR/table-order.sql" \
  | sed 's|public\.||')

if [[ -z "$LAYERS" ]]; then
  echo "ℹ Sem marcadores '-- layer:', caindo para import serial via import-data.sh"
  exec "$SCRIPT_DIR/import-data.sh"
fi

CURRENT_LAYER=""
BATCH=()
flush() {
  [[ ${#BATCH[@]} -eq 0 ]] && return
  echo "  ↳ camada $CURRENT_LAYER: ${#BATCH[@]} tabelas (paralelo=$PARALLEL)"
  printf '%s\n' "${BATCH[@]}" | xargs -n1 -P"$PARALLEL" -I{} bash -c '
    tbl="$1"; f="'"$DATA_DIR"'/${tbl}.csv"
    [[ -f "$f" ]] || { echo "  ⚠ sem CSV para $tbl"; exit 0; }
    psql "'"$DEST_DB_URL"'" -c "\COPY public.${tbl} FROM '"'"'${f}'"'"' WITH CSV HEADER" \
      && echo "  ✔ $tbl" || echo "  ✖ $tbl"
  ' _ {}
  BATCH=()
}

while IFS='|' read -r layer tbl; do
  if [[ "$layer" != "$CURRENT_LAYER" ]]; then
    flush
    CURRENT_LAYER="$layer"
  fi
  BATCH+=("$tbl")
done <<< "$LAYERS"
flush

echo "▶ Realinhando sequences"
psql "$DEST_DB_URL" <<'SQL' >/dev/null
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT sequence_schema, sequence_name FROM information_schema.sequences WHERE sequence_schema='public'
  LOOP EXECUTE format('SELECT setval(%L, COALESCE((SELECT last_value FROM %I.%I)+1, 1), false)',
    r.sequence_schema||'.'||r.sequence_name, r.sequence_schema, r.sequence_name); END LOOP; END $$;
SQL

psql "$DEST_DB_URL" -c "SET session_replication_role = origin;" >/dev/null
echo "✔ Import paralelo concluído."
