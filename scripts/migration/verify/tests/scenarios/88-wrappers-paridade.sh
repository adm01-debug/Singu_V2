#!/usr/bin/env bash
# extensions-versions.sh, grants-parity.sh, triggers-parity.sh e tz-locale-parity.sh entre
# dois bancos reais: idênticos → 0; depois de divergir cada item → 1; infra quebrada → 2.
EXPECTED_EXIT=0
requires(){ command -v jq >/dev/null || { echo "jq ausente"; return 1; }; exige_extensao_disponivel pg_trgm; }
setup(){
  B="${PGDATABASE}_b"
  sql "CREATE DATABASE \"$B\"" || return 1
  local db
  for db in "$PGDATABASE" "$B"; do
    PGDATABASE="$db" psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<'SQL' || return 1
CREATE TABLE public.t(id int PRIMARY KEY, v text);
CREATE FUNCTION public.tg() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER t_tg BEFORE INSERT ON public.t FOR EACH ROW EXECUTE FUNCTION public.tg();
SQL
  done
}
run_guard(){
  export SRC_DB_URL DEST_DB_URL OUT_DIR="$SCN_TMP/out"
  SRC_DB_URL="$(db_url)"; DEST_DB_URL="$(db_url "$B")"
  local s
  for s in extensions-versions grants-parity triggers-parity tz-locale-parity; do
    espera_saida 0 bash "$VERIFY_DIR/$s.sh" >"$SCN_TMP/$s.igual.log" 2>&1 || { cat "$SCN_TMP/$s.igual.log"; return 1; }
  done
  [[ -s "$OUT_DIR/triggers-src.txt" && ! -e "$VERIFY_DIR/out/triggers-src.txt" ]] || { echo "OUT_DIR não respeitado"; return 1; }
  PGDATABASE="$B" psql -X -q -v ON_ERROR_STOP=1 >/dev/null <<SQL || return 1
CREATE EXTENSION pg_trgm;
GRANT SELECT ON public.t TO PUBLIC;
CREATE OR REPLACE FUNCTION public.tg() RETURNS trigger LANGUAGE plpgsql AS \$\$ BEGIN NEW.v := 'x'; RETURN NEW; END \$\$;
ALTER DATABASE "$B" SET timezone = 'America/Sao_Paulo';
SQL
  for s in extensions-versions grants-parity triggers-parity tz-locale-parity; do
    espera_saida 1 bash "$VERIFY_DIR/$s.sh" >"$SCN_TMP/$s.dif.log" 2>&1 || { cat "$SCN_TMP/$s.dif.log"; return 1; }
  done
  contem "$SCN_TMP/extensions-versions.dif.log" 'pg_trgm' || return 1
  contem "$SCN_TMP/grants-parity.dif.log" 'public.t::PUBLIC::SELECT' || return 1
  contem "$SCN_TMP/triggers-parity.dif.log" 'public.tg\(\)::' || return 1
  contem "$SCN_TMP/tz-locale-parity.dif.log" 'timezone=America/Sao_Paulo' || return 1
  # infra: destino inacessível → 2 com mensagem (antes: saía calado com o código do psql)
  for s in extensions-versions grants-parity triggers-parity tz-locale-parity; do
    DEST_DB_URL="postgresql://x@127.0.0.1:1/x" PGCONNECT_TIMEOUT=2 espera_saida 2 bash "$VERIFY_DIR/$s.sh" >"$SCN_TMP/$s.err.log" 2>&1 || return 1
    contem "$SCN_TMP/$s.err.log" '(DESTINO|destino)' || return 1
  done
  [[ -z "$(find "$OUT_DIR" -name '*.tmp')" ]] || { echo "sobrou snapshot parcial"; return 1; }
  ( unset SRC_DB_URL; espera_saida 2 bash "$VERIFY_DIR/tz-locale-parity.sh" ) >/dev/null 2>&1
}
cleanup_scenario(){ psql -X -q -c "DROP DATABASE IF EXISTS \"${PGDATABASE}_b\" WITH (FORCE)" >/dev/null 2>&1 || true; }
