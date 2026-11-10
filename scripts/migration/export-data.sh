#!/usr/bin/env bash
# ============================================================================
# export-data.sh — exporta dados do schema public da ORIGEM para CSVs gzipados.
# Somente leitura na origem; todas as tabelas saem do MESMO snapshot.
#
# Uso:
#   bash scripts/migration/export-data.sh                 # tudo (respeitando skip)
#   bash scripts/migration/export-data.sh --only contacts # 1 tabela (ignora skip)
#   bash scripts/migration/export-data.sh --resume        # pula csv já existente
#   bash scripts/migration/export-data.sh --dry-run       # só lista o que exportaria
#   bash scripts/migration/export-data.sh --no-snapshot   # sem snapshot compartilhado
#
# Ambiente (lido de scripts/migration/.env ou env.migration; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL)  conexão da origem — obrigatória
#   DATA_DIR                       destino dos CSVs (padrão scripts/migration/data)
#   MIGRATION_PARALLEL             jobs simultâneos (padrão 4)
#
# Saída: $DATA_DIR/NNN_<tabela>.csv.gz + _manifest.tsv (nn, table, rows, bytes,
#        columns) + _order.tsv (nn, tabela, camada topológica).
# Exit: 0 ok · 1 alguma tabela falhou (manifesto NÃO é gravado) · 2 uso/config
#       · 130 interrompido.
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$HERE/_lib.sh"
MIG_TAG="export"

ONLY=""; RESUME=0; DRY_RUN=0; USE_SNAPSHOT=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)        mig_opt_arg "$1" $#; ONLY="$2"; shift 2 ;;
    --resume)      RESUME=1; shift ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --no-snapshot) USE_SNAPSHOT=0; shift ;;
    -h|--help)     mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$HERE/.env" "$HERE/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
[[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "defina SRC_DB_URL (ou SOURCE_DB_URL) — veja env.example"
DATA_DIR="${DATA_DIR:-$HERE/data}"
PARALLEL="${MIGRATION_PARALLEL:-4}"
if ! mig_is_uint "$PARALLEL" || (( PARALLEL < 1 )); then mig_die 2 "MIGRATION_PARALLEL inválido: $PARALLEL"; fi
mig_need psql gzip gunzip awk

SKIP_FILE="$HERE/skip-tables.txt"
ORDER_SQL="$HERE/table-order.sql"
[[ -f "$SKIP_FILE" && -f "$ORDER_SQL" ]] || mig_die 2 "faltam skip-tables.txt/table-order.sql em $HERE"

umask 077            # CSVs contêm dado pessoal
mkdir -p "$DATA_DIR"
DATA_DIR="$(cd "$DATA_DIR" && pwd)"
MANIFEST="$DATA_DIR/_manifest.tsv"
ORDER_TSV="$DATA_DIR/_order.tsv"
COLS_TSV="$DATA_DIR/_columns.tsv"

skip_match() {
  local t="$1" pat
  while IFS= read -r pat || [[ -n "$pat" ]]; do
    pat="${pat%$'\r'}"
    [[ -z "$pat" || "$pat" =~ ^[[:space:]]*# ]] && continue
    # shellcheck disable=SC2053  # curinga intencional (glob da skip-list)
    [[ "$t" == $pat ]] && return 0
  done < "$SKIP_FILE"
  return 1
}

cleanup() {
  local rc=$?
  trap - EXIT INT TERM
  [[ -n "${SNAP_PID:-}" ]] && kill "$SNAP_PID" 2>/dev/null
  local pids; pids="$(jobs -p)"
  # shellcheck disable=SC2086  # lista de PIDs separada por espaço
  [[ -n "$pids" ]] && kill $pids 2>/dev/null
  wait 2>/dev/null
  rm -f "$DATA_DIR"/*.partial "$ORDER_TSV.tmp" "$COLS_TSV.tmp" "$MANIFEST.tmp" 2>/dev/null
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

mig_log "origem: $(mig_target "$SRC_DB_URL") → $DATA_DIR"
mig_log "gerando ordem topológica de tabelas na origem..."
mig_psql "$SRC_DB_URL" -XAtq -v ON_ERROR_STOP=1 -v with_depth=1 -f "$ORDER_SQL" > "$ORDER_TSV.tmp" \
  || mig_die 1 "não consegui ler a ordem de tabelas na origem"
mv "$ORDER_TSV.tmp" "$ORDER_TSV"
# Colunas reais (sem geradas), já com quote_ident — vão para COPY e manifesto.
mig_psql "$SRC_DB_URL" -XAtq -F $'\t' -v ON_ERROR_STOP=1 > "$COLS_TSV.tmp" <<'SQL' || mig_die 1 "não consegui ler as colunas na origem"
SELECT c.relname, string_agg(quote_ident(a.attname), ',' ORDER BY a.attnum)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relispartition
GROUP BY c.relname;
SQL
mv "$COLS_TSV.tmp" "$COLS_TSV"
total=$(wc -l < "$ORDER_TSV" | tr -d ' ')
mig_log "$total tabelas encontradas em public"

cols_of() { awk -F '\t' -v t="$1" '$1 == t { print $2; exit }' "$COLS_TSV"; }

# --- seleção ---------------------------------------------------------------
SEL_NN=(); SEL_TABLE=()
while IFS=$'\t' read -r nn table _depth; do
  [[ -z "$table" ]] && continue
  if [[ -n "$ONLY" ]]; then
    [[ "$table" == "$ONLY" ]] || continue
  elif skip_match "$table"; then
    echo "  ⇢ [skip-list] $table"
    continue
  fi
  if [[ "$table" == */* || "$table" == .* ]]; then
    mig_die 1 "nome de tabela não suportado como arquivo: '$table'"
  fi
  SEL_NN+=("$nn"); SEL_TABLE+=("$table")
done < "$ORDER_TSV"
if [[ -n "$ONLY" && ${#SEL_TABLE[@]} -eq 0 ]]; then
  mig_die 2 "--only $ONLY: tabela não existe em public na origem"
fi

if (( DRY_RUN )); then
  for i in "${!SEL_TABLE[@]}"; do echo "  [dry-run] exportaria ${SEL_NN[$i]}_${SEL_TABLE[$i]}.csv.gz"; done
  mig_log "dry-run: ${#SEL_TABLE[@]} tabela(s); nada foi gravado além de _order.tsv/_columns.tsv"
  exit 0
fi

# --- snapshot compartilhado --------------------------------------------------
SNAPSHOT=""
if (( USE_SNAPSHOT )); then
  coproc SNAP { mig_psql "$SRC_DB_URL" -XAtq -v ON_ERROR_STOP=1 2>/dev/null; }
  printf 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;\nSELECT pg_export_snapshot();\n' >&"${SNAP[1]}" || true
  if ! IFS= read -r -t 30 SNAPSHOT <&"${SNAP[0]}" || [[ ! "$SNAPSHOT" =~ ^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9]+$ ]]; then
    SNAPSHOT=""
    mig_err "⚠ não foi possível exportar snapshot (pooler em modo transação?) — seguindo SEM consistência entre tabelas; congele a origem antes"
  else
    mig_log "snapshot compartilhado: $SNAPSHOT"
  fi
fi

# --- worker por tabela -------------------------------------------------------
export_one() {
  local nn="$1" table="$2"
  local out="$DATA_DIR/${nn}_${table}.csv.gz" meta="$DATA_DIR/${nn}_${table}.meta"
  local err="$DATA_DIR/_err_${table}.log" tmp cols qtable rows bytes
  if [[ $RESUME -eq 1 && -s "$out" && -s "$meta" ]]; then
    echo "  ⇢ [resume] $table (já existe)"
    return 0
  fi
  tmp="${out}.partial"
  cols="$(cols_of "$table")"
  [[ -n "$cols" ]] || { echo "  ✗ FALHA em $table (sem colunas exportáveis)" >&2; return 1; }
  qtable="public.\"${table//\"/\"\"}\""
  local pre=()
  if [[ -n "$SNAPSHOT" ]]; then
    pre=(-c "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" -c "SET TRANSACTION SNAPSHOT '$SNAPSHOT'")
  fi
  if ! mig_psql "$SRC_DB_URL" -Xq -v ON_ERROR_STOP=1 "${pre[@]}" \
        -c "\\copy ${qtable} (${cols}) TO STDOUT WITH (FORMAT csv, HEADER true, FORCE_QUOTE *)" \
        2>"$err" | gzip -c > "$tmp"; then
    echo "  ✗ FALHA em $table (ver $err)" >&2
    rm -f "$tmp"
    return 1
  fi
  mv "$tmp" "$out"
  rm -f "$err"
  # Registros CSV reais: quebra de linha dentro de aspas não conta como linha.
  rows=$(gunzip -c "$out" | awk '{ q += gsub(/"/, "&") } q % 2 == 0 { n++; q = 0 } END { print (n > 0 ? n - 1 : 0) }')
  bytes=$(wc -c < "$out" | tr -d ' ')
  printf '%s\t%s\t%s\t%s\t%s\n' "$nn" "$table" "$rows" "$bytes" "$cols" > "$meta"
  printf '  ✓ %-40s %10d linhas\n' "$table" "$rows"
}

rm -f "$MANIFEST"    # manifesto só existe se o export inteiro terminar bem
if [[ $RESUME -eq 0 && -z "$ONLY" ]]; then
  # export completo novo: remove sobras de execuções anteriores (tabela que sumiu da origem)
  rm -f "$DATA_DIR"/[0-9][0-9][0-9]_*.csv.gz "$DATA_DIR"/[0-9][0-9][0-9]_*.meta "$DATA_DIR"/_err_*.log
fi
running=0; failures=0
for i in "${!SEL_TABLE[@]}"; do
  export_one "${SEL_NN[$i]}" "${SEL_TABLE[$i]}" &
  running=$((running+1))
  if (( running >= PARALLEL )); then
    wait -n || failures=$((failures+1))
    running=$((running-1))
  fi
done
while (( running > 0 )); do
  wait -n || failures=$((failures+1))
  running=$((running-1))
done

if [[ -n "${SNAP_PID:-}" ]]; then
  snap_pid="$SNAP_PID"
  { printf 'COMMIT;\n\\q\n' >&"${SNAP[1]}"; } 2>/dev/null || true
  wait "$snap_pid" 2>/dev/null || true
fi

if (( failures > 0 )); then
  mig_die 1 "$failures tabela(s) falharam — export INCOMPLETO, manifesto não gravado (corrija e rode com --resume)"
fi

{
  printf 'nn\ttable\trows\tbytes\tcolumns\n'
  if compgen -G "$DATA_DIR/*.meta" >/dev/null; then cat "$DATA_DIR"/*.meta | sort -t $'\t' -k1,1 -k2,2; fi
} > "$MANIFEST.tmp"
mv "$MANIFEST.tmp" "$MANIFEST"

echo ""
mig_log "✅ export concluído. Manifest: $MANIFEST"
echo "   Tabelas no manifesto: $(( $(wc -l < "$MANIFEST") - 1 ))"
echo "   Tamanho total: $(du -sh "$DATA_DIR" | cut -f1)"
