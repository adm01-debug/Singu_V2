#!/usr/bin/env bash
# ssl-enforcement-audit.sql — ssl=on mas um cliente conectado por TCP sem TLS → falha.
CLUSTER=endurecido
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup(){
  bg_abre claro PGSSLMODE=disable || return 1
  bg_envia claro "SELECT 1;"
  espera_ate "SELECT count(*) = 1 FROM pg_stat_ssl s JOIN pg_stat_activity a USING (pid)
               WHERE a.application_name = 'guardtest-claro' AND NOT s.ssl" 10
}
run_guard(){ guard ssl-enforcement-audit.sql; }
cleanup_scenario(){ bg_fecha claro; }
