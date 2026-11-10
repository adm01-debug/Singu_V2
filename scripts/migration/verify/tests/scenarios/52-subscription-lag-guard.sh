#!/usr/bin/env bash
# subscription-lag-guard.sql — o original só fazia SELECT. Limpo: subscription criada
# DESABILITADA (connect=false) não é problema. Plantado: habilitada apontando para um
# publisher inexistente → fica sem apply worker. (O worker existe por milissegundos a cada
# tentativa de conexão; por isso até 3 leituras.)
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){ [[ "$(sql_at "SELECT rolsuper FROM pg_roles WHERE rolname = current_user")" == t ]] || { echo "exige superuser (CREATE SUBSCRIPTION)"; return 1; }; }
setup_ok(){
  sql "CREATE SUBSCRIPTION ${SCN_ID}_sub CONNECTION 'host=127.0.0.1 port=1 dbname=nada connect_timeout=1' PUBLICATION p WITH (connect = false)" 2>/dev/null
}
setup(){ sql "ALTER SUBSCRIPTION ${SCN_ID}_sub ENABLE"; }
run_guard(){
  local i rc=0
  for i in 1 2 3; do
    guard subscription-lag-guard.sql; rc=$?
    [[ $rc -ne 0 ]] && return "$rc"
    sleep 0.5
  done
  return 0
}
run_guard_ok(){ guard subscription-lag-guard.sql; }
cleanup_scenario(){
  psql -X -q -c "ALTER SUBSCRIPTION ${SCN_ID}_sub DISABLE" -c "ALTER SUBSCRIPTION ${SCN_ID}_sub SET (slot_name = NONE)" \
       -c "DROP SUBSCRIPTION ${SCN_ID}_sub" >/dev/null 2>&1 || true
}
