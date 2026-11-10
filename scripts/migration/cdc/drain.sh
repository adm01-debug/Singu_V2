#!/usr/bin/env bash
# ============================================================================
# drain.sh — drena o slot lógico da ORIGEM para arquivo em CDC_OUT_DIR.
# Roda em foreground (Ctrl+C encerra limpo); use `nohup ./drain.sh &` para
# background. Somente leitura na origem (consome WAL do slot).
#
# Uso: ./cdc/drain.sh [--dry-run]
# Ambiente (scripts/migration/.env; ambiente vence):
#   SRC_DB_URL (ou SOURCE_DB_URL)  origem — obrigatória
#   CDC_SLOT     slot lógico (padrão migration_slot) — precisa existir
#   CDC_OUT_DIR  pasta de saída (padrão cdc/out); arquivos 600 (contêm dados)
#   CDC_PLUGIN   plugin esperado no slot (padrão wal2json; as opções
#                format-version/include-lsn/include-timestamp só vão para ele)
# Exit: 0 encerrado pelo operador · 1 pg_recvlogical falhou · 2 uso/config,
#       slot inexistente, de outro plugin ou já em uso por outro drain.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="drain"

DRY_RUN=0
case "${1:-}" in
  --dry-run) DRY_RUN=1 ;;
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
[[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "defina SRC_DB_URL"
CDC_OUT_DIR="${CDC_OUT_DIR:-$SCRIPT_DIR/out}"
CDC_SLOT="${CDC_SLOT:-migration_slot}"
CDC_PLUGIN="${CDC_PLUGIN:-wal2json}"
[[ "$CDC_SLOT" =~ ^[a-z0-9_]{1,63}$ ]] || mig_die 2 "CDC_SLOT inválido: use só a-z, 0-9 e _"
mig_need psql pg_recvlogical

info="$(mig_psql "$SRC_DB_URL" -XAtq -F ' ' -v ON_ERROR_STOP=1 -v slot="$CDC_SLOT" <<'SQL'
SELECT plugin, active::text FROM pg_replication_slots WHERE slot_name = :'slot';
SQL
)" || mig_die 2 "não consegui consultar a origem ($(mig_target "$SRC_DB_URL"))"
[[ -n "$info" ]] || mig_die 2 "slot '$CDC_SLOT' não existe na origem — crie-o antes (veja cdc/README.md)"
read -r plugin active <<<"$info"
[[ "$plugin" == "$CDC_PLUGIN" ]] || mig_die 2 "slot '$CDC_SLOT' usa o plugin '$plugin', esperado '$CDC_PLUGIN'"
[[ "$active" == "false" ]] || mig_die 2 "slot '$CDC_SLOT' já está em uso por outro processo (drain duplicado?)"

OPTS=()
if [[ "$CDC_PLUGIN" == "wal2json" ]]; then
  OPTS=(--option=format-version=2 --option=include-lsn=true --option=include-timestamp=true)
fi

umask 077
mkdir -p "$CDC_OUT_DIR"
FILE="$CDC_OUT_DIR/wal-$(date -u +%Y%m%dT%H%M%SZ)-$$.json"

mig_pg_split "$SRC_DB_URL"
if (( DRY_RUN )); then
  mig_log "dry-run: pg_recvlogical -d $(mig_target "$SRC_DB_URL") --slot $CDC_SLOT --start ${OPTS[*]} --file $FILE"
  exit 0
fi
[[ -z "$MIG_PG_PASSWORD" ]] || export PGPASSWORD="$MIG_PG_PASSWORD"

mig_log "▶ Drenando slot=$CDC_SLOT para $FILE (Ctrl+C para parar)"
rc=0
pg_recvlogical -d "$MIG_PG_URL" --slot "$CDC_SLOT" --start "${OPTS[@]}" \
  --file "$FILE" --fsync-interval=1000 || rc=$?
# 130/143 = encerrado por SIGINT/SIGTERM do operador (pg_recvlogical fecha o arquivo antes)
if (( rc == 0 || rc == 130 || rc == 143 )); then
  mig_log "drain encerrado ($(wc -c < "$FILE" 2>/dev/null | tr -d ' ' || echo 0) bytes em $FILE)"
  exit 0
fi
mig_die 1 "pg_recvlogical terminou com erro (código $rc)"
