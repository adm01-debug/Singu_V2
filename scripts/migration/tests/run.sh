#!/usr/bin/env bash
# ============================================================================
# run.sh — roda todos os testes do kit de migração (scripts/migration/tests).
#
# Uso: bash scripts/migration/tests/run.sh [padrão]     ex.: run.sh dr
#   T_VERBOSE=1 mostra cada asserção que passou.
# Postgres: usa PGHOST/PGPORT/PGUSER (padrão 127.0.0.1, porta 5432 ou 55432,
# usuário postgres) com bancos descartáveis g6t_*; partes que exigem
# wal_level=logical, papéis ou um segundo cluster sobem um Postgres efêmero
# (initdb em /tmp, porta 554xx) e o derrubam no fim. Sem Postgres/initdb, os
# testes que dependem dele se PULAM com mensagem "SKIP" (não falham).
# Nada fala com rede externa nem com projeto Supabase real.
# Exit: 0 tudo verde (ou pulado) · 1 algum teste falhou.
# ============================================================================
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pattern="${1:-}"
failed=(); ran=0
for t in "$HERE"/*.test.sh; do
  [[ -z "$pattern" || "$(basename "$t")" == *"$pattern"* ]] || continue
  echo "━━ $(basename "$t")"
  ran=$((ran+1))
  bash "$t" || failed+=("$(basename "$t")")
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $ran -eq 0 ]]; then echo "nenhum teste corresponde a '$pattern'"; exit 1; fi
if [[ ${#failed[@]} -gt 0 ]]; then
  echo "FALHOU: ${failed[*]}"
  exit 1
fi
echo "TODOS OS $ran ARQUIVOS DE TESTE PASSARAM"
