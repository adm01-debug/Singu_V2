#!/usr/bin/env bash
# Wrapper: diff canônico de GRANTs em public.* entre origem e destino.
# Uso: SRC_DB_URL=... DEST_DB_URL=... [OUT_DIR=<dir>] ./verify/grants-parity.sh
# Grava grants-src.txt, grants-dest.txt e grants.diff em OUT_DIR (default: verify/out/,
# ignorado pelo git). Somente leitura no banco.
# Códigos de saída: 0 = paridade; 1 = divergência; 2 = erro de uso ou extração falhou.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# Variável já definida no ambiente vence o ../.env (dá para apontar para outro banco, ou
# testar, sem editar o arquivo).
_SRC_AMBIENTE="${SRC_DB_URL:-}"; _DEST_AMBIENTE="${DEST_DB_URL:-}"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"
[[ -n "$_SRC_AMBIENTE" ]]  && SRC_DB_URL="$_SRC_AMBIENTE"
[[ -n "$_DEST_AMBIENTE" ]] && DEST_DB_URL="$_DEST_AMBIENTE"

SQL="$SCRIPT_DIR/grants-parity.sql"
[[ -n "${SRC_DB_URL:-}" ]]  || { echo "✖ SRC_DB_URL obrigatório" >&2; exit 2; }
[[ -n "${DEST_DB_URL:-}" ]] || { echo "✖ DEST_DB_URL obrigatório" >&2; exit 2; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

OUT="${OUT_DIR:-$SCRIPT_DIR/out}"
mkdir -p "$OUT" || { echo "✖ não consegui criar $OUT" >&2; exit 2; }
SRC="$OUT/grants-src.txt"
DST="$OUT/grants-dest.txt"

log() { printf '[grants-parity %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

# Extrai para .tmp e só renomeia se o psql terminou bem: nunca deixa snapshot parcial.
extrai() { # extrai <url> <destino> <rótulo>
  if ! psql "$1" -X -Atq -v ON_ERROR_STOP=1 -f "$SQL" >"$2.tmp"; then
    rm -f "$2.tmp"; echo "✖ extração falhou ($3)" >&2; exit 2
  fi
  mv -f "$2.tmp" "$2"
}

log "extraindo grants da origem..."
extrai "$SRC_DB_URL" "$SRC" origem
log "extraindo grants do destino..."
extrai "$DEST_DB_URL" "$DST" destino

if diff -u "$SRC" "$DST" > "$OUT/grants.diff"; then
  log "OK GRANTs com paridade total em public.*"
  exit 0
fi

log "DIVERGENCIA de GRANTs detectada - ver $OUT/grants.diff"
head -n 80 "$OUT/grants.diff"
exit 1
