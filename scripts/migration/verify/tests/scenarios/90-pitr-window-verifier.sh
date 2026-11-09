#!/usr/bin/env bash
# pitr-window-verifier.sh — com respostas controladas (psql dublê) para cobrir os 5 ramos, e
# contra o cluster real. O original respondia "OK PITR window saudavel" quando NUNCA houve
# arquivamento (COALESCE(..., 0)) e quando archive_mode estava desligado.
EXPECTED_EXIT=0
run_guard(){
  local v="$VERIFY_DIR/pitr-window-verifier.sh" modo
  export DEST_DB_URL; DEST_DB_URL="$(db_url)"
  # cluster real: o veredito acompanha archive_mode
  modo="$(config archive_mode)"
  if [[ "$modo" == off ]]; then
    espera_saida 1 bash "$v" >"$SCN_TMP/real.log" 2>&1 || { cat "$SCN_TMP/real.log"; return 1; }
    contem "$SCN_TMP/real.log" 'FATAL: archive_mode=off' || return 1
  fi
  (
    dubla psql <<'EOS'
case "${DUBLE_RESPOSTA:-}" in erro) exit 2 ;; *) printf '%s\n' "$DUBLE_RESPOSTA" ;; esac
EOS
    DUBLE_RESPOSTA='on|0.5000|0'   espera_saida 0 bash "$v" >"$SCN_TMP/d0.log" 2>&1 || exit 1
    contem "$SCN_TMP/d0.log" 'OK PITR window saudavel' || exit 1
    DUBLE_RESPOSTA='on||0'         espera_saida 1 bash "$v" >"$SCN_TMP/d1.log" 2>&1 || exit 1
    contem "$SCN_TMP/d1.log" 'nenhum WAL arquivado' || exit 1
    DUBLE_RESPOSTA='on|72.2500|0'  espera_saida 1 bash "$v" >"$SCN_TMP/d2.log" 2>&1 || exit 1
    contem "$SCN_TMP/d2.log" 'archiver estagnado' || exit 1
    DUBLE_RESPOSTA='on|72.2500|0' RPO_HOURS=100 espera_saida 0 bash "$v" >/dev/null 2>&1 || exit 1
    DUBLE_RESPOSTA='on|1.0000|7'   espera_saida 0 bash "$v" >"$SCN_TMP/d3.log" 2>&1 || exit 1
    contem "$SCN_TMP/d3.log" 'WARN: pg_stat_archiver.failed_count=7' || exit 1
    DUBLE_RESPOSTA='off||0'        espera_saida 1 bash "$v" >/dev/null 2>&1 || exit 1
    DUBLE_RESPOSTA='erro'          espera_saida 2 bash "$v" >/dev/null 2>&1 || exit 1
    DUBLE_RESPOSTA='on|lixo|0'     espera_saida 2 bash "$v" >/dev/null 2>&1 || exit 1
    # locale com vírgula decimal não pode quebrar o printf
    DUBLE_RESPOSTA='on|0.5000|0' LANG=pt_BR.UTF-8 LC_NUMERIC=pt_BR.UTF-8 espera_saida 0 bash "$v" >/dev/null 2>&1 || exit 1
    RPO_HOURS=abc espera_saida 2 bash "$v" >/dev/null 2>&1
  ) || return 1
  ( unset DEST_DB_URL; espera_saida 2 bash "$v" ) >/dev/null 2>&1
}
