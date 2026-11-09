#!/usr/bin/env bash
# full-audit.sh --verificar-lista: todo *.sql do diretório está em exatamente uma lista.
# Prova os dois lados numa cópia do diretório: arquivo novo não listado, arquivo listado
# que sumiu e arquivo em duas listas são acusados (saída 2).
EXPECTED_EXIT=0
run_guard(){
  bash "$VERIFY_DIR/full-audit.sh" --verificar-lista || return 1
  local copia="$SCN_TMP/verify"
  mkdir -p "$copia" && cp "$VERIFY_DIR"/*.sql "$VERIFY_DIR/full-audit.sh" "$copia/" || return 1
  echo "SELECT 1;" >"$copia/novo-guard.sql"
  rm "$copia/tables-without-pk.sql"
  sed -i 's/^  bloat-monitor.sql$/  bloat-monitor.sql\n  invalid-indexes-guard.sql/' "$copia/full-audit.sh"
  espera_saida 2 bash "$copia/full-audit.sh" --verificar-lista >"$SCN_TMP/lista.log" 2>&1 || return 1
  contem "$SCN_TMP/lista.log" '^NAO-LISTADO novo-guard.sql$' || return 1
  contem "$SCN_TMP/lista.log" '^LISTADO-INEXISTENTE tables-without-pk.sql$' || return 1
  contem "$SCN_TMP/lista.log" '^LISTADO-2-VEZES invalid-indexes-guard.sql$' || return 1
  # usos inválidos
  espera_saida 2 bash "$VERIFY_DIR/full-audit.sh" --nao-existe >/dev/null 2>&1 || return 1
  ( unset DEST_DB_URL; cd "$SCN_TMP" && espera_saida 2 bash "$copia/full-audit.sh" ) >"$SCN_TMP/semurl.log" 2>&1 || return 1
  contem "$SCN_TMP/semurl.log" 'DEST_DB_URL obrigatorio' || return 1
  bash "$VERIFY_DIR/full-audit.sh" --help | grep -q 'verificar-lista' || return 1
  [[ "$(bash "$VERIFY_DIR/full-audit.sh" --listar | wc -l)" == "$(find "$VERIFY_DIR" -maxdepth 1 -name '*.sql' | wc -l)" ]]
}
