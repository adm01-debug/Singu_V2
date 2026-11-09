#!/usr/bin/env bash
# pitr-window-verifier.sh — Rodada 19/10
# Valida que o arquivamento de WAL cobre o RPO declarado (default 48h).
#
# Uso: DEST_DB_URL=... [RPO_HOURS=48] ./pitr-window-verifier.sh
# Falha (1) se: archive_mode desligado; nenhum WAL jamais arquivado; ou o ultimo WAL
# arquivado e mais antigo que RPO_HOURS. Falhas de archive_command so geram WARN.
# Codigos de saida: 0 = ok; 1 = PITR comprometido; 2 = erro de uso ou consulta falhou.
# Somente leitura.
set -euo pipefail
export LC_ALL=C

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
[[ -n "${DEST_DB_URL:-}" ]] || { echo "ERRO: DEST_DB_URL obrigatorio" >&2; exit 2; }
RPO_HOURS="${RPO_HOURS:-48}"
[[ "$RPO_HOURS" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "ERRO: RPO_HOURS invalido: $RPO_HOURS" >&2; exit 2; }

echo "== pitr-window-verifier (RPO=${RPO_HOURS}h) =="

# Uma linha: archive_mode | idade em horas do ultimo WAL arquivado (vazio = nunca) | failed_count
if ! LINHA=$(PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}" psql "$DEST_DB_URL" -X -Atq -F '|' -v ON_ERROR_STOP=1 -c "
  SELECT current_setting('archive_mode'),
         COALESCE(ROUND((EXTRACT(EPOCH FROM (now() - last_archived_time))/3600)::numeric, 4)::text, ''),
         failed_count
    FROM pg_stat_archiver;
"); then
  echo "ERRO: consulta ao destino falhou — janela de PITR nao avaliada." >&2; exit 2
fi
IFS='|' read -r MODE OLDEST FAILURES <<<"$LINHA" || true

if [[ "$MODE" != "on" && "$MODE" != "always" ]]; then
  echo "FATAL: archive_mode=${MODE:-<desconhecido>}. Sem arquivamento de WAL nao ha PITR."
  exit 1
fi
if [[ -z "$OLDEST" ]]; then
  echo "FATAL: nenhum WAL arquivado ate agora (last_archived_time nulo). PITR sem cobertura."
  exit 1
fi
[[ "$OLDEST" =~ ^-?[0-9]+([.][0-9]+)?$ ]] || { echo "ERRO: resposta inesperada do destino: '$LINHA'" >&2; exit 2; }

printf 'WAL age mais recente arquivado: %.2fh (RPO alvo: %sh)\n' "$OLDEST" "$RPO_HOURS"

STAGNANT=$(awk -v a="$OLDEST" -v r="$RPO_HOURS" 'BEGIN{print (a+0>r+0)?"1":"0"}')
if [[ "$STAGNANT" == "1" ]]; then
  echo "FATAL: archiver estagnado ha ${OLDEST}h (> RPO ${RPO_HOURS}h). PITR quebrado."
  exit 1
fi

if [[ "${FAILURES:-0}" =~ ^[0-9]+$ && "${FAILURES:-0}" -gt 0 ]]; then
  echo "WARN: pg_stat_archiver.failed_count=${FAILURES}. Investigar archive_command."
fi

echo "OK PITR window saudavel."
