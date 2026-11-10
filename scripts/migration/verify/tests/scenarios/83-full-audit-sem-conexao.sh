#!/usr/bin/env bash
# full-audit.sh com o destino inacessível: sai 3 sem rodar nenhum guard — antes cada um dos
# 60+ arquivos "falhava" e o exporter publicaria 26 FATAL falsos.
EXPECTED_EXIT=0
run_guard(){
  DEST_DB_URL="postgresql://ninguem@127.0.0.1:1/nada" PGCONNECT_TIMEOUT=2 \
    espera_saida 3 bash "$VERIFY_DIR/full-audit.sh" >"$SCN_TMP/audit.log" 2>&1 || return 1
  contem "$SCN_TMP/audit.log" 'ERRO DE CONEXAO' || return 1
  nao_contem "$SCN_TMP/audit.log" '=== (FATAL|WARN|FAIL): '
}
