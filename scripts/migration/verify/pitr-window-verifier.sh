#!/usr/bin/env bash
# pitr-window-verifier.sh — Rodada 19/10
# Valida que WAL retention cobre o RPO declarado (default 48h).
set -euo pipefail

: "${DEST_DB_URL:?DEST_DB_URL obrigatorio}"
RPO_HOURS="${RPO_HOURS:-48}"

echo "== pitr-window-verifier (RPO=${RPO_HOURS}h) =="

OLDEST=$(psql "$DEST_DB_URL" -Atc "
  SELECT COALESCE(EXTRACT(EPOCH FROM (now() - last_archived_time))/3600, 0)
    FROM pg_stat_archiver;
")

printf 'WAL age mais recente arquivado: %.2fh (RPO alvo: %sh)\n' "$OLDEST" "$RPO_HOURS"

STAGNANT=$(awk -v a="$OLDEST" -v r="$RPO_HOURS" 'BEGIN{print (a>r)?"1":"0"}')
if [[ "$STAGNANT" == "1" ]]; then
  echo "FATAL: archiver estagnado ha ${OLDEST}h (> RPO ${RPO_HOURS}h). PITR quebrado."
  exit 1
fi

FAILURES=$(psql "$DEST_DB_URL" -Atc "SELECT failed_count FROM pg_stat_archiver;")
if [[ "${FAILURES:-0}" -gt 0 ]]; then
  echo "WARN: pg_stat_archiver.failed_count=${FAILURES}. Investigar archive_command."
fi

echo "OK PITR window saudavel."