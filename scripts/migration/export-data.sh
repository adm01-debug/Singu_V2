#!/usr/bin/env bash
# ============================================================================
# export-data.sh — exporta dados do schema public da ORIGEM para CSVs gzipados.
#
# Uso:
#   source scripts/migration/env.migration     # define SOURCE_DB_URL
#   bash scripts/migration/export-data.sh                 # tudo (respeitando skip)
#   bash scripts/migration/export-data.sh --only contacts # 1 tabela
#   bash scripts/migration/export-data.sh --resume        # pula csv já existente
#
# Saída: scripts/migration/data/NNN_<tabela>.csv.gz + _manifest.tsv
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$HERE/data"
SKIP_FILE="$HERE/skip-tables.txt"
ORDER_SQL="$HERE/table-order.sql"
MANIFEST="$DATA_DIR/_manifest.tsv"
PARALLEL="${MIGRATION_PARALLEL:-4}"

ONLY=""
RESUME=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)   ONLY="$2"; shift 2 ;;
    --resume) RESUME=1; shift ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "arg desconhecido: $1" >&2; exit 2 ;;
  esac
done

: "${SOURCE_DB_URL:?defina SOURCE_DB_URL (veja env.example)}"
mkdir -p "$DATA_DIR"

# --- skip list -------------------------------------------------------------
skip_match() {
  local t="$1"
  while IFS= read -r pat; do
    [[ -z "$pat" || "$pat" =~ ^# ]] && continue
    # shellcheck disable=SC2053
    [[ "$t" == $pat ]] && return 0
  done < "$SKIP_FILE"
  return 1
}

# --- lista ordenada --------------------------------------------------------
echo "▶ gerando ordem topológica de tabelas na origem..."
ORDER_TSV="$DATA_DIR/_order.tsv"
psql "$SOURCE_DB_URL" -Atq -v ON_ERROR_STOP=1 -f "$ORDER_SQL" > "$ORDER_TSV"
total=$(wc -l < "$ORDER_TSV" | tr -d ' ')
echo "  → $total tabelas encontradas em public"

# --- worker por tabela -----------------------------------------------------
export_one() {
  local nn="$1" table="$2"
  local out="$DATA_DIR/${nn}_${table}.csv.gz"
  if [[ $RESUME -eq 1 && -s "$out" ]]; then
    echo "  ⇢ [skip] $table (já existe)"
    return 0
  fi
  local tmp="${out}.partial"
  # \COPY em stdout; erros derrubam o pipe (pipefail cuida)
  if ! psql "$SOURCE_DB_URL" -v ON_ERROR_STOP=1 \
        -c "\\COPY public.\"${table}\" TO STDOUT WITH (FORMAT csv, HEADER true, FORCE_QUOTE *)" \
        2>"$DATA_DIR/_err_${table}.log" \
      | gzip -c > "$tmp"; then
    echo "  ✗ FALHA em $table (ver _err_${table}.log)" >&2
    rm -f "$tmp"
    return 1
  fi
  mv "$tmp" "$out"
  rm -f "$DATA_DIR/_err_${table}.log"
  # contagem exata (gunzip | wc -l) - 1 (header)
  local rows
  rows=$(( $(gunzip -c "$out" | wc -l) - 1 ))
  printf '%s\t%s\t%s\t%s\n' "$nn" "$table" "$rows" "$(stat -c %s "$out" 2>/dev/null || stat -f %z "$out")" \
    >> "$MANIFEST"
  printf '  ✓ %-40s %10d linhas\n' "$table" "$rows"
}
export -f export_one
export SOURCE_DB_URL DATA_DIR RESUME

: > "$MANIFEST"
printf 'nn\ttable\trows\tbytes\n' > "$MANIFEST"

# --- loop principal --------------------------------------------------------
jobs_running=0
i=0
while IFS=$'\t' read -r nn table; do
  [[ -z "$table" ]] && continue
  i=$((i+1))
  if [[ -n "$ONLY" && "$table" != "$ONLY" ]]; then continue; fi
  if [[ -z "$ONLY" ]] && skip_match "$table"; then
    echo "  ⇢ [skip-list] $table"
    continue
  fi
  export_one "$nn" "$table" &
  jobs_running=$((jobs_running+1))
  if (( jobs_running >= PARALLEL )); then
    wait -n || true
    jobs_running=$((jobs_running-1))
  fi
done < "$ORDER_TSV"
wait

echo ""
echo "✅ export concluído. Manifest: $MANIFEST"
echo "   Tabelas exportadas: $(( $(wc -l < "$MANIFEST") - 1 ))"
echo "   Tamanho total: $(du -sh "$DATA_DIR" | cut -f1)"