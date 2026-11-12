#!/usr/bin/env bash
# full-audit.sh com o destino inacessível: sai 3 sem rodar nenhum guard — antes cada um dos
# 60+ arquivos "falhava" e o exporter publicaria 26 FATAL falsos.
EXPECTED_EXIT=0
run_guard(){
  DEST_DB_URL="postgresql://ninguem@127.0.0.1:1/nada" PGCONNECT_TIMEOUT=2 \
    espera_saida 3 bash "$VERIFY_DIR/full-audit.sh" >"$SCN_TMP/audit.log" 2>&1 || return 1
  contem "$SCN_TMP/audit.log" 'ERRO DE CONEXAO' || return 1
  nao_contem "$SCN_TMP/audit.log" '=== (FATAL|WARN|FAIL): ' || return 1
  # ../.env: é lido quando o ambiente não define a URL; quando define, o ambiente vence
  # (senão um .env de produção sequestraria qualquer execução de teste).
  local copia="$SCN_TMP/migration/verify"
  mkdir -p "$copia" && cp "$VERIFY_DIR"/*.sql "$VERIFY_DIR/full-audit.sh" "$copia/" || return 1
  echo 'DEST_DB_URL="postgresql://ninguem@127.0.0.1:1/do-dotenv"' >"$SCN_TMP/migration/.env"
  ( unset DEST_DB_URL; PGCONNECT_TIMEOUT=2 espera_saida 3 bash "$copia/full-audit.sh" ) >/dev/null 2>&1 || { echo ".env não foi lido"; return 1; }
  DEST_DB_URL="$(db_url)" bash "$copia/full-audit.sh" >"$SCN_TMP/env.log" 2>&1
  contem "$SCN_TMP/env.log" '=== FATAL: invalid-indexes-guard.sql ==='
}
