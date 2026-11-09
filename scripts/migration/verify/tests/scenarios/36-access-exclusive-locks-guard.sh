#!/usr/bin/env bash
# access-exclusive-locks-guard.sql — plantado: sessão segurando LOCK ... ACCESS EXCLUSIVE
# numa transação aberta; limiar reduzido por -v max_min (default 5 min).
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){ sql "CREATE TABLE public.t(id int PRIMARY KEY)"; }
setup(){
  bg_abre trava || return 1
  bg_envia trava "BEGIN;"
  bg_envia trava "LOCK TABLE public.t IN ACCESS EXCLUSIVE MODE;"
  espera_ate "SELECT count(*) = 1 FROM pg_locks WHERE relation = 'public.t'::regclass AND mode = 'AccessExclusiveLock' AND granted" 10 || return 1
  sleep 2.2
}
run_guard(){ guard access-exclusive-locks-guard.sql -v max_min=0.03; }
cleanup_scenario(){ bg_fecha trava; }
