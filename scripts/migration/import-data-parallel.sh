#!/usr/bin/env bash
# ============================================================================
# import-data-parallel.sh — import paralelo por camadas topológicas de FK.
# Cada tabela é um job próprio (sessão com FKs/triggers desligados + COPY em
# transação); as camadas rodam em ordem e uma camada com falha interrompe as
# seguintes. Para carga atômica (tudo ou nada) use import-data.sh.
#
# Uso:
#   DATA_DIR=./data ./import-data-parallel.sh              # carrega
#   ./import-data-parallel.sh --truncate                   # esvazia antes (sem CASCADE)
#   ./import-data-parallel.sh --dry-run                    # mostra camadas e sai
#   ./import-data-parallel.sh --yes                        # sem pergunta
#
# Ambiente (scripts/migration/.env ou env.migration; ambiente vence):
#   DEST_DB_URL (ou TARGET_DB_URL)  destino — obrigatória
#   DATA_DIR    pasta do export (padrão scripts/migration/data). Aceita
#               NNN_<tabela>.csv.gz (export-data.sh) e <tabela>.csv (legado).
#   PARALLEL    jobs simultâneos por camada (padrão 4)
#   CONFIRM=<host:porta/banco>  confirma sem terminal (alternativa a --yes)
#
# Camadas: 3ª coluna de $DATA_DIR/_order.tsv (gravada pelo export); sem ela,
# calculadas no destino com table-order.sql (-v with_depth=1).
# Exit: 0 ok · 1 alguma tabela falhou (lista impressa; as demais ficaram
#       carregadas — corrija e rode de novo com --truncate) · 2 uso/config.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"
MIG_TAG="import-par"

TRUNCATE=0; DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --truncate) TRUNCATE=1; shift ;;
    --dry-run)  DRY_RUN=1; shift ;;
    --yes)      MIG_YES=1; shift ;;
    -h|--help)  mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$SCRIPT_DIR/.env" "$SCRIPT_DIR/env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL (ou TARGET_DB_URL)"
PARALLEL="${PARALLEL:-4}"
if ! mig_is_uint "$PARALLEL" || (( PARALLEL < 1 )); then mig_die 2 "PARALLEL inválido: $PARALLEL"; fi
mig_need psql gunzip awk

DEFAULT_DIR="$SCRIPT_DIR/data"
if [[ -n "${DATA_DIR:-}" && ! -d "$DATA_DIR" && -f "$DEFAULT_DIR/_manifest.tsv" ]]; then
  mig_err "⚠ DATA_DIR=$DATA_DIR não existe; usando o export em $DEFAULT_DIR (onde export-data.sh grava por padrão)"
  DATA_DIR="$DEFAULT_DIR"
fi
DATA_DIR="${DATA_DIR:-$DEFAULT_DIR}"
[[ -d "$DATA_DIR" ]] || mig_die 2 "sem $DATA_DIR — rode export-data.sh primeiro"
DATA_DIR="$(cd "$DATA_DIR" && pwd)"
MANIFEST="$DATA_DIR/_manifest.tsv"

WORK="$(mktemp -d)"
cleanup() {
  local rc=$? pids
  trap - EXIT INT TERM
  pids="$(jobs -p)"
  # shellcheck disable=SC2086  # lista de PIDs separada por espaço
  [[ -n "$pids" ]] && kill $pids 2>/dev/null
  wait 2>/dev/null
  rm -rf "$WORK"
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# --- inventário: tabela → arquivo --------------------------------------------
declare -A FILE_OF=()
shopt -s nullglob
for f in "$DATA_DIR"/*.csv.gz "$DATA_DIR"/*.csv; do
  base="$(basename "$f")"
  if [[ "$base" == *.csv.gz ]]; then t="${base%.csv.gz}"; else t="${base%.csv}"; fi
  [[ "$t" =~ ^[0-9]{3}_(.+)$ ]] && t="${BASH_REMATCH[1]}"
  [[ -z "${FILE_OF[$t]+x}" ]] || mig_die 2 "dois arquivos para a tabela $t em $DATA_DIR"
  FILE_OF[$t]="$f"
done
shopt -u nullglob
[[ ${#FILE_OF[@]} -gt 0 ]] || mig_die 2 "nenhum CSV em $DATA_DIR — rode export-data.sh primeiro"

# --- camadas -----------------------------------------------------------------
ORDER="$WORK/order.tsv"
if [[ -f "$DATA_DIR/_order.tsv" ]] && awk -F '\t' 'NF < 3 { bad = 1 } END { exit bad }' "$DATA_DIR/_order.tsv"; then
  cp "$DATA_DIR/_order.tsv" "$ORDER"
else
  mig_log "sem camadas no export — calculando no destino"
  mig_psql "$DEST_DB_URL" -XAtq -v ON_ERROR_STOP=1 -v with_depth=1 -f "$SCRIPT_DIR/table-order.sql" > "$ORDER" \
    || mig_die 1 "não consegui calcular as camadas no destino"
fi

LAYERS=(); declare -A LAYER_TABLES=(); declare -A SEEN=()
while IFS=$'\t' read -r _nn table depth; do
  [[ -n "${FILE_OF[$table]+x}" ]] || continue
  SEEN[$table]=1
  if [[ -z "${LAYER_TABLES[$depth]+x}" ]]; then LAYERS+=("$depth"); LAYER_TABLES[$depth]=""; fi
  LAYER_TABLES[$depth]+="$table"$'\n'
done < <(sort -t $'\t' -k3,3n -k2,2 "$ORDER")
for t in "${!FILE_OF[@]}"; do
  [[ -n "${SEEN[$t]+x}" ]] || mig_die 2 "CSV de '$t' não corresponde a nenhuma tabela conhecida em public"
done

mf_field() {  # mf_field <tabela> <coluna do manifesto: 3=rows 5=columns>
  [[ -f "$MANIFEST" ]] || return 0
  awk -F '\t' -v t="$1" -v c="$2" 'NR > 1 && $2 == t { print $c; exit }' "$MANIFEST"
}
qident() { printf '"%s"' "${1//\"/\"\"}"; }

TARGET="$(mig_target "$DEST_DB_URL")"
# HEADER match (PG >= 15) confere os nomes do cabeçalho do CSV contra as colunas.
HEADER_OPT="true"
ver="$(mig_psql "$DEST_DB_URL" -XAtq -c 'SHOW server_version_num' 2>/dev/null)" \
  || mig_die 2 "não consegui conectar no destino ($TARGET)"
if mig_is_uint "$ver" && (( ver >= 150000 )); then HEADER_OPT="match"; fi
mig_log "destino: $TARGET · ${#FILE_OF[@]} tabela(s) em ${#LAYERS[@]} camada(s) · paralelo=$PARALLEL"
if (( DRY_RUN )); then
  for depth in "${LAYERS[@]}"; do
    echo "  [dry-run] camada $depth: $(tr '\n' ' ' <<<"${LAYER_TABLES[$depth]}")"
  done
  mig_log "dry-run: nada foi alterado no destino"
  exit 0
fi
mig_confirm "Isto GRAVA ${#FILE_OF[@]} tabela(s) em $TARGET$([[ $TRUNCATE -eq 1 ]] && echo " e APAGA o conteúdo atual delas")." "$TARGET"

if (( TRUNCATE )); then
  list=""
  for t in "${!FILE_OF[@]}"; do list+="${list:+, }public.$(qident "$t")"; done
  mig_psql "$DEST_DB_URL" -Xq -v ON_ERROR_STOP=1 -c "TRUNCATE ${list} RESTART IDENTITY" \
    || mig_die 1 "TRUNCATE recusado — nada foi carregado"
fi

# --- job por tabela ----------------------------------------------------------
load_one() {
  local table="$1" f="${FILE_OF[$1]}" cols rows got stream=(cat)
  cols="$(mf_field "$table" 5)"; rows="$(mf_field "$table" 3)"
  [[ "$f" == *.gz ]] && stream=(gunzip -c)
  # replica + COPY na MESMA sessão; dados entram por stdin (caminho fora do SQL).
  if "${stream[@]}" "$f" | mig_psql "$DEST_DB_URL" -X -v ON_ERROR_STOP=1 \
       -c "SET session_replication_role = replica" \
       -c "\\copy public.$(qident "$table")${cols:+ (${cols})} FROM STDIN WITH (FORMAT csv, HEADER ${HEADER_OPT})" \
       > "$WORK/$2.log" 2>&1; then
    got="$(awk '$1 == "COPY" { n = $2 } END { print n }' "$WORK/$2.log")"
    if mig_is_uint "$rows" && [[ "$got" != "$rows" ]]; then
      echo "  ✖ $table: export tem $rows linha(s), carga inseriu ${got:-?}" >&2
      printf '%s\n' "$table" >> "$WORK/failed"
      return 1
    fi
    echo "  ✔ $table (${got:-?} linhas)"
  else
    echo "  ✖ $table: $(tail -n 2 "$WORK/$2.log" | tr '\n' ' ')" >&2
    printf '%s\n' "$table" >> "$WORK/failed"
    return 1
  fi
}

job=0
for depth in "${LAYERS[@]}"; do
  mapfile -t batch < <(printf '%s' "${LAYER_TABLES[$depth]}")
  echo "  ↳ camada $depth: ${#batch[@]} tabela(s)"
  running=0
  for t in "${batch[@]}"; do
    job=$((job+1))
    load_one "$t" "$job" &
    running=$((running+1))
    if (( running >= PARALLEL )); then wait -n || true; running=$((running-1)); fi
  done
  while (( running > 0 )); do wait -n || true; running=$((running-1)); done
  if [[ -s "$WORK/failed" ]]; then
    mig_err "✖ falha na camada $depth: $(tr '\n' ' ' < "$WORK/failed")"
    mig_die 1 "import paralelo INCOMPLETO — camadas seguintes não foram carregadas; corrija e rode de novo com --truncate"
  fi
done

mig_log "realinhando sequences (serial e identity)"
mig_psql "$DEST_DB_URL" -Xq -v ON_ERROR_STOP=1 <<'SQL' || mig_die 1 "falha ao realinhar sequences"
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
SQL
mig_log "✔ import paralelo concluído (${#FILE_OF[@]} tabelas)."
