#!/usr/bin/env bash
# wal-sender-timeout-guard.sql — wal_sender_timeout é ajustável por sessão: dá para provar
# os dois lados sem tocar no cluster. Plantado: 0 (infinito) e 10 min (acima do teto).
EXPECTED_EXIT=0
DOIS_LADOS=1
run_guard_ok(){ PGOPTIONS='-c wal_sender_timeout=60s' guard wal-sender-timeout-guard.sql; }
run_guard(){
  PGOPTIONS='-c wal_sender_timeout=0' espera_saida nonzero guard wal-sender-timeout-guard.sql || return 1
  PGOPTIONS='-c wal_sender_timeout=10min' espera_saida nonzero guard wal-sender-timeout-guard.sql || return 1
  PGOPTIONS='-c wal_sender_timeout=10min' espera_saida 0 guard wal-sender-timeout-guard.sql -v max_ms=900000
}
