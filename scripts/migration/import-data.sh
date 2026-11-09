#!/usr/bin/env bash
# ============================================================================
# import-data.sh — carrega os CSVs de export-data.sh no DESTINO, em UMA sessão
# e UMA transação (tudo ou nada), com FKs/triggers desligados na sessão.
#
# Pré-requisitos no destino:
#   - DDL 00..05 aplicado (schemas, tabelas, índices, FKs, grants).
#   - RLS (06), policies (07), triggers (09), views (10) NÃO aplicados ainda
#     — aplicar DEPOIS deste script para máxima performance.
#
# Uso:
#   bash scripts/migration/import-data.sh                    # tudo
#   bash scripts/migration/import-data.sh --only contacts
#   bash scripts/migration/import-data.sh --truncate         # esvazia as tabelas importadas antes
#   bash scripts/migration/import-data.sh --truncate-cascade # idem, com CASCADE (apaga dependentes!)
#   bash scripts/migration/import-data.sh --dry-run          # mostra o plano, não toca no destino
#   bash scripts/migration/import-data.sh --yes              # sem pergunta de confirmação
#
# Ambiente (scripts/migration/.env ou env.migration; ambiente vence):
#   DEST_DB_URL (ou TARGET_DB_URL)  conexão do destino — obrigatória
#   DATA_DIR                        origem dos CSVs (padrão scripts/migration/data)
#   CONFIRM=<host:porta/banco>      confirma sem terminal (alternativa a --yes)
#
# Segurança: a ação real exige --yes, CONFIRM=<alvo> ou confirmação no terminal.
# --truncate esvazia TODAS as tabelas importadas de uma vez, ANTES das cargas e
# sem CASCADE: se outra tabela depender delas o Postgres recusa (nada é apagado).
# Reexecutar sem --truncate em tabela já carregada falha por chave duplicada e
# desfaz tudo (transação única).
# Exit: 0 ok · 1 falha no import (rollback total) · 2 uso/config/confirmação.
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$HERE/_lib.sh"
MIG_TAG="import"

ONLY=""; TRUNCATE=0; CASCADE=""; DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)             mig_opt_arg "$1" $#; ONLY="$2"; shift 2 ;;
    --truncate)         TRUNCATE=1; shift ;;
    --truncate-cascade) TRUNCATE=1; CASCADE=" CASCADE"; shift ;;
    --dry-run)          DRY_RUN=1; shift ;;
    --yes)              MIG_YES=1; shift ;;
    -h|--help)          mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$HERE/.env" "$HERE/env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL (ou TARGET_DB_URL) — veja env.example"
DATA_DIR="${DATA_DIR:-$HERE/data}"
[[ -d "$DATA_DIR" ]] || mig_die 2 "sem $DATA_DIR — rode export-data.sh primeiro"
DATA_DIR="$(cd "$DATA_DIR" && pwd)"
MANIFEST="$DATA_DIR/_manifest.tsv"
mig_need psql gunzip awk

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
trap 'exit 130' INT TERM
[[ "$WORK" =~ ^[A-Za-z0-9_./-]+$ ]] || mig_die 2 "TMPDIR com caracteres especiais não é suportado: $WORK"
SQL_FILE="$WORK/import.sql"

mf_field() {  # mf_field <tabela> <coluna do manifesto: 3=rows 5=columns>
  [[ -f "$MANIFEST" ]] || return 0
  awk -F '\t' -v t="$1" -v c="$2" 'NR > 1 && $2 == t { print $c; exit }' "$MANIFEST"
}

TABLES=(); FILES=()
shopt -s nullglob
for f in "$DATA_DIR"/*.csv.gz; do
  fname="$(basename "$f")"
  table="${fname#*_}"; table="${table%.csv.gz}"
  if [[ -n "$ONLY" && "$table" != "$ONLY" ]]; then continue; fi
  TABLES+=("$table"); FILES+=("$f")
done
shopt -u nullglob
if [[ ${#TABLES[@]} -eq 0 ]]; then
  [[ -z "$ONLY" ]] || mig_die 2 "--only $ONLY: não há CSV dessa tabela em $DATA_DIR"
  mig_die 2 "nenhum *.csv.gz em $DATA_DIR — rode export-data.sh primeiro"
fi
[[ -f "$MANIFEST" ]] || mig_err "⚠ sem _manifest.tsv (export incompleto ou antigo) — sem lista de colunas nem conferência de contagem"

qident() { printf '"%s"' "${1//\"/\"\"}"; }

# HEADER match (PG >= 15) confere os nomes do cabeçalho do CSV contra as colunas.
HEADER_OPT="true"
ver="$(mig_psql "$DEST_DB_URL" -XAtq -c 'SHOW server_version_num' 2>/dev/null)" \
  || mig_die 2 "não consegui conectar no destino ($(mig_target "$DEST_DB_URL"))"
if mig_is_uint "$ver" && (( ver >= 150000 )); then HEADER_OPT="match"; fi

{
  echo "\\set ON_ERROR_STOP on"
  echo "SET session_replication_role = replica;   -- desliga triggers + FKs nesta sessão"
  echo "SET lock_timeout = '30s';"
  echo "SET statement_timeout = '0';"
  echo "SET client_min_messages = warning;"
  echo "BEGIN;"
  if [[ $TRUNCATE -eq 1 ]]; then
    list=""
    for t in "${TABLES[@]}"; do list+="${list:+, }public.$(qident "$t")"; done
    echo "TRUNCATE ${list} RESTART IDENTITY${CASCADE};"
  fi
  echo "CREATE TEMP TABLE _mig_expect (tbl regclass, before_n bigint, expected bigint) ON COMMIT DROP;"
  for i in "${!TABLES[@]}"; do
    t="${TABLES[$i]}"
    ln -s "${FILES[$i]}" "$WORK/$i.csv.gz"     # nome neutro: caminho com espaço/aspas não entra no SQL
    cols="$(mf_field "$t" 5)"; rows="$(mf_field "$t" 3)"
    qt="public.$(qident "$t")"
    printf '\\echo → %s\n' "$t"
    if mig_is_uint "$rows"; then
      echo "INSERT INTO _mig_expect SELECT '${qt//\'/\'\'}'::regclass, (SELECT count(*) FROM ${qt}), ${rows};"
    fi
    echo "\\copy ${qt}${cols:+ (${cols})} FROM PROGRAM 'gunzip -c $WORK/$i.csv.gz' WITH (FORMAT csv, HEADER ${HEADER_OPT})"
  done
  cat <<'SQL_CHECK'
-- Confere o que entrou contra a contagem gravada pelo export (manifesto).
DO $$
DECLARE r RECORD; n BIGINT;
BEGIN
  FOR r IN SELECT * FROM _mig_expect LOOP
    EXECUTE format('SELECT count(*) FROM %s', r.tbl) INTO n;
    IF n - r.before_n <> r.expected THEN
      RAISE EXCEPTION 'tabela %: export tem % linha(s), carga inseriu %', r.tbl, r.expected, n - r.before_n;
    END IF;
  END LOOP;
END $$;
SQL_CHECK
  cat <<'SQL_SEQ'
-- Realinha TODA sequence ligada a coluna de public (serial E identity).
DO $$
DECLARE r RECORD; qty BIGINT;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS tbl, a.attname,
           pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) AS seq
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
      AND pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) IS NOT NULL
  LOOP
    EXECUTE format('SELECT MAX(%I) FROM %s', r.attname, r.tbl) INTO qty;
    IF qty IS NOT NULL AND qty > 0 THEN
      PERFORM setval(r.seq::regclass, qty, true);
    END IF;
  END LOOP;
END $$;
SQL_SEQ
  echo "COMMIT;"
  echo "RESET session_replication_role;"
} > "$SQL_FILE"

TARGET="$(mig_target "$DEST_DB_URL")"
mig_log "destino: $TARGET · ${#TABLES[@]} tabela(s) de $DATA_DIR$([[ $TRUNCATE -eq 1 ]] && echo " · TRUNCATE${CASCADE} antes")"
if (( DRY_RUN )); then
  for t in "${TABLES[@]}"; do echo "  [dry-run] carregaria public.$t"; done
  mig_log "dry-run: nada foi alterado no destino"
  exit 0
fi
mig_confirm "Isto GRAVA ${#TABLES[@]} tabela(s) em $TARGET$([[ $TRUNCATE -eq 1 ]] && echo " e APAGA o conteúdo atual delas")." "$TARGET"

mig_log "aplicando import no destino (uma sessão, uma transação)..."
if ! mig_psql "$DEST_DB_URL" -X -v ON_ERROR_STOP=1 -f "$SQL_FILE"; then
  mig_die 1 "import falhou — transação desfeita, destino inalterado"
fi

echo ""
mig_log "✅ import concluído."
echo "   Próximo passo:"
echo "     psql \"\$DEST_DB_URL\" -f scripts/migration/ddl/06_rls_enable.sql"
echo "     psql \"\$DEST_DB_URL\" -f scripts/migration/ddl/07_policies.sql"
echo "     psql \"\$DEST_DB_URL\" -f scripts/migration/ddl/09_triggers.sql"
echo "     psql \"\$DEST_DB_URL\" -f scripts/migration/ddl/10_views.sql"
echo "     bash scripts/migration/compare-counts.sh"
