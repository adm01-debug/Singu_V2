#!/usr/bin/env bash
# 25b: cria > 100 large objects orfaos.
# Limpo: 120 large objects REFERENCIADOS por coluna oid não contam como órfãos.
EXPECTED_EXIT=nonzero
DOIS_LADOS=1
setup_ok(){
  sql "CREATE TABLE public.anexos(id serial PRIMARY KEY, conteudo oid);
       INSERT INTO public.anexos(conteudo) SELECT lo_create(0) FROM generate_series(1, 120);"
}
setup(){
  psql -c "DO \$\$ BEGIN FOR i IN 1..110 LOOP PERFORM lo_create(0); END LOOP; END \$\$;" >/dev/null
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../orphaned-large-objects.sql"; }
cleanup_scenario(){
  psql -c "DO \$\$ DECLARE r record; BEGIN FOR r IN SELECT oid FROM pg_largeobject_metadata LOOP PERFORM lo_unlink(r.oid); END LOOP; END \$\$;" >/dev/null 2>&1 || true
}
