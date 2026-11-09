#!/usr/bin/env bash
# prepared-xacts-guard.sql — plantado: PREPARE TRANSACTION esquecido; limiar por -v max_min.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
requires(){ [[ "$(config max_prepared_transactions)" -gt 0 ]] || { echo "exige max_prepared_transactions > 0 (cluster tem 0)"; return 1; }; }
setup(){
  psql -X -q -v ON_ERROR_STOP=1 -c "BEGIN; CREATE TABLE public.t2pc(id int); PREPARE TRANSACTION '${SCN_ID}';" >/dev/null || return 1
  sleep 2.2
}
run_guard(){ guard prepared-xacts-guard.sql -v max_min=0.03; }
cleanup_scenario(){ psql -X -q -c "ROLLBACK PREPARED '${SCN_ID}'" >/dev/null 2>&1 || true; }
