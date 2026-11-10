#!/usr/bin/env bash
# Todo *.sql roda limpo num banco com dados "saudáveis" (fixtures/dados.sql): os guards não
# podem acusar nada (falso-positivo) e os audits têm linhas de verdade para processar.
EXPECTED_EXIT=0
setup(){ psql -X -q -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/fixtures/dados.sql" >/dev/null 2>"$SCN_TMP/fixture.err" || { cat "$SCN_TMP/fixture.err"; return 1; }; }
run_guard(){ fumaca_sql; }
