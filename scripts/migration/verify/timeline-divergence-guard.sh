#!/usr/bin/env bash
# timeline-divergence-guard.sh — Rodada 20/10
# Compara o timeline_id do ultimo checkpoint entre origem e destino.
#
# Uso: SRC_DB_URL=... DEST_DB_URL=... ./timeline-divergence-guard.sh
# So faz sentido entre nos do MESMO cluster fisico (primario x replica/standby promovido):
# timelines diferentes ali indicam split-brain. Entre dois clusters independentes
# (migracao logica) os numeros nao sao comparaveis.
# Codigos de saida: 0 = alinhadas; 1 = divergentes; 2 = erro de uso ou consulta falhou.
# Somente leitura.
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
[[ -n "${SRC_DB_URL:-}" ]]  || { echo "ERRO: SRC_DB_URL obrigatorio" >&2; exit 2; }
[[ -n "${DEST_DB_URL:-}" ]] || { echo "ERRO: DEST_DB_URL obrigatorio" >&2; exit 2; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

echo "== timeline-divergence-guard =="

timeline() { psql "$1" -X -Atq -v ON_ERROR_STOP=1 -c "SELECT timeline_id FROM pg_control_checkpoint();"; }
SRC_TL=$(timeline "$SRC_DB_URL")  || { echo "ERRO: nao li o timeline da ORIGEM." >&2; exit 2; }
DST_TL=$(timeline "$DEST_DB_URL") || { echo "ERRO: nao li o timeline do DESTINO." >&2; exit 2; }
if [[ ! "$SRC_TL" =~ ^[0-9]+$ || ! "$DST_TL" =~ ^[0-9]+$ ]]; then
  echo "ERRO: timeline inesperado (origem='$SRC_TL' destino='$DST_TL')." >&2; exit 2
fi

printf 'SRC timeline_id : %s\nDEST timeline_id: %s\n' "$SRC_TL" "$DST_TL"

if [[ "$SRC_TL" != "$DST_TL" ]]; then
  echo "FATAL: timelines divergentes (split-brain)."
  exit 1
fi
echo "OK timelines alinhadas."
