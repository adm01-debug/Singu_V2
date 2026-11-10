#!/usr/bin/env bash
# schema-freeze-guard.sql — o original lia current_setting('psql.action'), que nunca é
# preenchido por "-v action=..." (snapshot jamais era gravado) e dependia de extensions.digest.
# Limpo: snapshot + check sem mudança. Plantado: ALTER TABLE depois do snapshot.
EXPECTED_EXIT=0
DOIS_LADOS=1
setup_ok(){ sql "CREATE TABLE public.t(id int PRIMARY KEY)"; }
run_guard_ok(){
  espera_saida nonzero guard schema-freeze-guard.sql >"$SCN_TMP/sem.log" 2>&1 || return 1      # check sem snapshot
  contem "$SCN_TMP/sem.log" 'Nenhum snapshot' || return 1
  guard schema-freeze-guard.sql -v action=snapshot || return 1
  [[ "$(sql_at 'SELECT count(*) FROM public._migration_schema_snapshot')" == 1 ]] || { echo "snapshot não gravado"; return 1; }
  [[ "$(sql_at "SELECT relrowsecurity FROM pg_class WHERE oid = 'public._migration_schema_snapshot'::regclass")" == t ]] || { echo "snapshot sem RLS"; return 1; }
  guard schema-freeze-guard.sql -v action=check && guard schema-freeze-guard.sql
}
setup(){ sql "ALTER TABLE public.t ADD COLUMN novo text"; }
run_guard(){
  espera_saida nonzero guard schema-freeze-guard.sql -v action=check >"$SCN_TMP/drift.log" 2>&1 || return 1
  contem "$SCN_TMP/drift.log" 'SCHEMA DRIFT' || return 1
  espera_saida nonzero guard schema-freeze-guard.sql -v action=apagar >"$SCN_TMP/inv.log" 2>&1 || return 1
  contem "$SCN_TMP/inv.log" 'action desconhecida'
}
