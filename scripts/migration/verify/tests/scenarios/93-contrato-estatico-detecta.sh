#!/usr/bin/env bash
# O teste estático (cenário 00) precisa REPROVAR quando o contrato é quebrado. Numa cópia da
# árvore: guard sem RAISE EXCEPTION, variável psql sem default, arquivo sem cabeçalho/fora
# das listas, guard sem cenário e meta-comando em SQL puro — cada violação tem de aparecer.
EXPECTED_EXIT=0
run_guard(){
  local r="$SCN_TMP/raiz" v out="$SCN_TMP/estatico.log"
  mkdir -p "$r/scripts/migration" "$r/scripts/monitoring" "$r/.github/workflows" || return 1
  cp -r "$VERIFY_DIR" "$r/scripts/migration/verify" && rm -rf "$r/scripts/migration/verify/tests/out" || return 1
  cp "$REPO_ROOT"/scripts/monitoring/*.sh "$r/scripts/monitoring/" || return 1
  cp "$REPO_ROOT"/.github/workflows/ci.yml "$r/.github/workflows/" 2>/dev/null
  v="$r/scripts/migration/verify"
  espera_saida 0 bash "$v/tests/contrato-estatico.test.sh" >"$out" 2>&1 || { cat "$out"; return 1; }   # cópia intacta passa
  sed -i 's/RAISE EXCEPTION/RAISE NOTICE/' "$v/prepared-xacts-guard.sql"
  sed -i '/^\\if :{?max_seg}/,/^\\endif/d' "$v/lock-wait-duration-guard.sql"
  printf 'SELECT 1;\n' >"$v/novo-guard.sql"
  rm "$v/tests/scenarios/30-invalid-indexes-guard.sh"
  sed -i '1i \\\\pset pager off' "$v/tz-locale-parity.sql"
  espera_saida 1 bash "$v/tests/contrato-estatico.test.sh" >"$out" 2>&1 || { cat "$out"; return 1; }
  contem "$out" 'prepared-xacts-guard.sql: classe GUARD sem RAISE EXCEPTION' || return 1
  contem "$out" 'lock-wait-duration-guard.sql: variável psql :max_seg sem default' || return 1
  contem "$out" "novo-guard.sql: cabeçalho sem" || return 1
  contem "$out" 'full-audit.sh --verificar-lista acusou divergência' || return 1
  contem "$out" 'invalid-indexes-guard.sql: nenhum cenário prova o lado RUIM' || return 1
  contem "$out" 'tz-locale-parity.sql: consumido via psql -c' || return 1
  contem "$out" 'novo-guard.sql: nenhum cenário prova'
}
