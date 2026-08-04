#!/usr/bin/env bash
# 25b: cria > 100 large objects orfaos.
EXPECTED_EXIT=nonzero
setup(){
  psql -c "DO \$\$ BEGIN FOR i IN 1..110 LOOP PERFORM lo_create(0); END LOOP; END \$\$;" >/dev/null
}
run_guard(){ psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/../orphaned-large-objects.sql"; }
cleanup_scenario(){
  psql -c "DO \$\$ DECLARE r record; BEGIN FOR r IN SELECT oid FROM pg_largeobject_metadata LOOP PERFORM lo_unlink(r.oid); END LOOP; END \$\$;" >/dev/null 2>&1 || true
}