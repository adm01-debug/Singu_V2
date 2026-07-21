#!/usr/bin/env bash
# ============================================================================
# import-data.sh — carrega CSVs de scripts/migration/data/ no DESTINO.
#
# Pré-requisitos no destino:
#   - DDL 00..05 aplicado (schemas, tabelas, índices, FKs, grants).
#   - RLS (06), policies (07), triggers (09), views (10) NÃO aplicados ainda
#     — aplicar DEPOIS deste script para máxima performance.
#
# Uso:
#   source scripts/migration/env.migration
#   bash scripts/migration/import-data.sh             # tudo
#   bash scripts/migration/import-data.sh --only contacts
#   bash scripts/migration/import-data.sh --truncate  # TRUNCATE antes de cada COPY
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$HERE/data"

ONLY=""
TRUNCATE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)     ONLY="$2"; shift 2 ;;
    --truncate) TRUNCATE=1; shift ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "arg desconhecido: $1" >&2; exit 2 ;;
  esac
done

: "${TARGET_DB_URL:?defina TARGET_DB_URL (veja env.example)}"
[[ -d "$DATA_DIR" ]] || { echo "sem $DATA_DIR — rode export-data.sh primeiro" >&2; exit 1; }

SQL_FILE="$(mktemp -t import-XXXXXX.sql)"
trap 'rm -f "$SQL_FILE"' EXIT

{
  echo "\\set ON_ERROR_STOP on"
  echo "SET session_replication_role = replica;   -- desliga triggers + FKs"
  echo "SET lock_timeout = '30s';"
  echo "SET statement_timeout = '0';"
  echo "SET client_min_messages = warning;"
  echo "BEGIN;"

  shopt -s nullglob
  for f in "$DATA_DIR"/*.csv.gz; do
    fname="$(basename "$f")"
    table="${fname#*_}"; table="${table%.csv.gz}"
    if [[ -n "$ONLY" && "$table" != "$ONLY" ]]; then continue; fi
    echo "\\echo → $table"
    if [[ $TRUNCATE -eq 1 ]]; then
      echo "TRUNCATE public.\"$table\" RESTART IDENTITY CASCADE;"
    fi
    echo "\\COPY public.\"$table\" FROM PROGRAM 'gunzip -c ${f}' WITH (FORMAT csv, HEADER true);"
  done

  cat <<'SQL_SEQ'
DO $$
DECLARE r RECORD; qty BIGINT;
BEGIN
  FOR r IN
    SELECT s.schemaname, s.sequencename,
           d.refobjid::regclass::text AS owner_table,
           a.attname                  AS owner_col
    FROM pg_sequences s
    JOIN pg_class    c ON c.relname   = s.sequencename AND c.relkind = 'S'
    JOIN pg_namespace n ON n.oid      = c.relnamespace AND n.nspname = s.schemaname
    JOIN pg_depend   d ON d.objid     = c.oid AND d.deptype = 'a'
    JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    WHERE s.schemaname = 'public'
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I),0) FROM %s', r.owner_col, r.owner_table) INTO qty;
    IF qty > 0 THEN
      PERFORM setval(format('%I.%I', r.schemaname, r.sequencename)::regclass, qty);
    END IF;
  END LOOP;
END $$;
SQL_SEQ

  echo "COMMIT;"
  echo "RESET session_replication_role;"
} > "$SQL_FILE"

echo "▶ aplicando import no destino (uma sessão, uma transação)..."
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"

echo ""
echo "✅ import concluído."
echo "   Próximo passo:"
echo "     psql \"\$TARGET_DB_URL\" -f scripts/migration/ddl/06_rls_enable.sql"
echo "     psql \"\$TARGET_DB_URL\" -f scripts/migration/ddl/07_policies.sql"
echo "     psql \"\$TARGET_DB_URL\" -f scripts/migration/ddl/09_triggers.sql"
echo "     psql \"\$TARGET_DB_URL\" -f scripts/migration/ddl/10_views.sql"
echo "     bash scripts/migration/compare-counts.sh"