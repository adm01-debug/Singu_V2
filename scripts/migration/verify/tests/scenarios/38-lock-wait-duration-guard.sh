#!/usr/bin/env bash
# lock-wait-duration-guard.sql — o original estourava "operator does not exist: integer =
# integer[]" (pg_blocking_pids devolve array) e, mesmo corrigido, só fazia SELECT.
# Plantado: sessão A segura o lock, sessão B fica esperando; limiar por -v max_seg.
EXPECTED_EXIT=0
DOIS_LADOS=1
setup_ok(){ sql "CREATE TABLE public.t(id int PRIMARY KEY)"; }
setup(){
  bg_abre dona || return 1
  bg_envia dona "BEGIN;"
  bg_envia dona "LOCK TABLE public.t IN ACCESS EXCLUSIVE MODE;"
  espera_ate "SELECT count(*) = 1 FROM pg_locks WHERE relation = 'public.t'::regclass AND granted AND mode = 'AccessExclusiveLock'" 10 || return 1
  bg_abre espera || return 1
  bg_envia espera "SELECT count(*) FROM public.t;"
  espera_ate "SELECT count(*) = 1 FROM pg_stat_activity WHERE application_name = 'guardtest-espera' AND wait_event_type = 'Lock'" 10 || return 1
  sleep 2.2
}
run_guard(){
  espera_saida nonzero guard lock-wait-duration-guard.sql -v max_seg=2 >"$SCN_TMP/saida.log" 2>&1 || return 1
  contem "$SCN_TMP/saida.log" 'sessao\(oes\) esperando lock' || return 1
  contem "$SCN_TMP/saida.log" 'LOCK TABLE public.t'          # a query bloqueadora aparece na listagem
}
run_guard_ok(){ guard lock-wait-duration-guard.sql -v max_seg=2; }
cleanup_scenario(){ bg_fecha espera; bg_fecha dona; }
