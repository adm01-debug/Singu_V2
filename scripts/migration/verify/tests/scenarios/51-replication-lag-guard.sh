#!/usr/bin/env bash
# replication-lag-guard.sql — plantado: um walsender de verdade (pg_receivewal) conectado.
# Lag de dezenas de segundos não é reproduzível sem uma réplica travada; com a réplica
# presente o limiar é rebaixado (-1 s) para provar que a linha é contada e comparada.
# Limpo: sem réplicas e com os limiares default.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){
  command -v pg_receivewal >/dev/null || { echo "pg_receivewal ausente"; return 1; }
  psql -X -q "replication=1 dbname=$PGDATABASE" -c "IDENTIFY_SYSTEM" >/dev/null 2>&1 \
    || { echo "conexão de replicação recusada (pg_hba/max_wal_senders)"; return 1; }
}
setup(){
  mkdir -p "$SCN_TMP/wal"
  pg_receivewal -D "$SCN_TMP/wal" --no-loop >"$SCN_TMP/receivewal.log" 2>&1 &
  echo $! >"$SCN_TMP/receivewal.pid"
  espera_ate "SELECT count(*) >= 1 FROM pg_stat_replication WHERE application_name = 'pg_receivewal'" 15
}
run_guard_ok(){ guard replication-lag-guard.sql; }
run_guard(){ guard replication-lag-guard.sql -v max_write_s=-1 -v max_replay_s=-1; }
cleanup_scenario(){
  [[ -f "$SCN_TMP/receivewal.pid" ]] && kill "$(cat "$SCN_TMP/receivewal.pid")" 2>/dev/null
  return 0
}
