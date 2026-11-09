#!/usr/bin/env bash
# Todo *.sql roda limpo como papel NÃO-superuser — com pg_monitor (parecido com o papel
# "postgres" do Supabase) e sem nada: o que exige privilégio vira SKIP com NOTICE, não erro cru.
EXPECTED_EXIT=0
requires(){ [[ "$(sql_at "SELECT rolsuper FROM pg_roles WHERE rolname = current_user")" == t ]] || { echo "exige superuser para criar os papéis de teste"; return 1; }; }
setup(){
  psql -X -q -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/fixtures/dados.sql" >/dev/null 2>&1 || return 1
  sql "CREATE ROLE ${SCN_ID}_mon; GRANT pg_monitor TO ${SCN_ID}_mon; CREATE ROLE ${SCN_ID}_comum;
       GRANT USAGE ON SCHEMA public TO ${SCN_ID}_mon, ${SCN_ID}_comum;
       GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${SCN_ID}_mon, ${SCN_ID}_comum;
       GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ${SCN_ID}_mon, ${SCN_ID}_comum;"
}
run_guard(){
  echo "── papel com pg_monitor ──"
  fumaca_sql PGOPTIONS="-c role=${SCN_ID}_mon" || return 1
  echo "── papel comum ──"
  fumaca_sql PGOPTIONS="-c role=${SCN_ID}_comum" || return 1
  # os SKIPs por privilégio aparecem de fato (não é só "rodou sem erro")
  contem "$SCN_TMP/fumaca-password-encryption-audit.sql.log" 'SKIP sem SELECT em pg_authid' || return 1
  contem "$SCN_TMP/fumaca-pg-hba-permissive-audit.sql.log" 'SKIP sem privilegio para ler pg_hba_file_rules' || return 1
  contem "$SCN_TMP/fumaca-pitr-retention-window.sql.log" 'SKIP: sem privilegio para pg_ls_waldir'
}
cleanup_scenario(){
  psql -X -q -c "DROP OWNED BY ${SCN_ID}_mon, ${SCN_ID}_comum" -c "DROP ROLE ${SCN_ID}_mon, ${SCN_ID}_comum" >/dev/null 2>&1 || true
}
