#!/usr/bin/env bash
# Valida migration + suíte RLS em transação revertida por arquivo.
cd diag/rlsval
for f in *.sql; do
  case "$f" in migration.sql|schema.sql) continue;; esac
  sed -E '/^(BEGIN|ROLLBACK);$/d' "$f" > "/tmp/t_$f"
  { echo 'BEGIN;'; echo '\i migration.sql'; echo "\\i /tmp/t_$f"; echo 'ROLLBACK;'; } > /tmp/run_$f
  if psql -X -q -v ON_ERROR_STOP=1 -v user_a=00000000-0000-0000-0000-00000000000a -v user_b=00000000-0000-0000-0000-00000000000b -v user_admin=00000000-0000-0000-0000-00000000000c -f "/tmp/run_$f" > /tmp/out_$f 2>&1; then
    echo "OK $f"
  else
    echo "FAIL $f"; grep -nE "ERROR|FAIL|❌|LINE|CONTEXT" /tmp/out_$f | head -8
  fi
done
echo "### pós-migration"
psql -X -At -c "BEGIN" -f migration.sql -c "SELECT 'definer='||count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND prosecdef" -c "SELECT 'anon_rel='||count(*) FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','p','v','m') AND (has_table_privilege('anon',c.oid,'SELECT') OR has_table_privilege('anon',c.oid,'INSERT') OR has_table_privilege('anon',c.oid,'UPDATE') OR has_table_privilege('anon',c.oid,'DELETE'))" -c "SELECT 'docsig_pol='||policyname||'|'||cmd||'|'||array_to_string(roles,',') FROM pg_policies WHERE schemaname='public' AND tablename IN ('document_signatures','csat_surveys')" -c "ROLLBACK" 2>&1 | grep -vE "^(BEGIN|ROLLBACK|REVOKE|GRANT|ALTER|DO|INSERT|CREATE)" | head -30
