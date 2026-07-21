#!/usr/bin/env bash
# TUI de progresso da janela de migração.
# Uso: ./dashboard.sh   (Ctrl+C para sair)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${DEST_DB_URL:?defina DEST_DB_URL}"

START="$(date +%s)"
WINDOW_MIN="${WINDOW_MIN:-240}"  # janela alvo em minutos

while true; do
  clear
  NOW=$(date +%s)
  ELAPSED_MIN=$(( (NOW - START) / 60 ))
  BUDGET_LEFT=$(( WINDOW_MIN - ELAPSED_MIN ))
  echo "═══ Migration Dashboard ═══════════════════════════════════════"
  echo "  Decorrido: ${ELAPSED_MIN}m / ${WINDOW_MIN}m    Restante: ${BUDGET_LEFT}m"
  echo "───────────────────────────────────────────────────────────────"

  echo "▶ Dados (linhas por tabela — top 10):"
  psql "$DEST_DB_URL" -tA -F' | ' <<'SQL' 2>/dev/null | head -10 | sed 's/^/  /' || echo "  (sem acesso ao DB)"
SELECT relname, n_live_tup FROM pg_stat_user_tables
WHERE schemaname='public' ORDER BY n_live_tup DESC LIMIT 10;
SQL

  echo ""
  echo "▶ Storage (contagem por bucket):"
  psql "$DEST_DB_URL" -tA -F' | ' <<'SQL' 2>/dev/null | sed 's/^/  /' || echo "  (sem acesso)"
SELECT bucket_id, count(*) FROM storage.objects GROUP BY 1 ORDER BY 1;
SQL

  echo ""
  echo "▶ Auth:"
  psql "$DEST_DB_URL" -tA -F' | ' <<'SQL' 2>/dev/null | sed 's/^/  /' || true
SELECT
  (SELECT count(*) FROM auth.users)       AS usuarios,
  (SELECT count(*) FROM auth.identities)  AS identities,
  (SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password') AS pendentes_reset;
SQL

  echo ""
  echo "▶ Cron:"
  psql "$DEST_DB_URL" -tA -F' | ' -c "SELECT count(*) AS jobs, count(*) FILTER (WHERE active) AS ativos FROM cron.job" 2>/dev/null | sed 's/^/  /' || true

  echo ""
  echo "═══ (atualiza a cada 10s — Ctrl+C sai) ════════════════════════"
  sleep 10
done
