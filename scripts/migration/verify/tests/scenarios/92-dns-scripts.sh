#!/usr/bin/env bash
# dns-multi-region.sh e dns-propagation.sh com um dig dublê no PATH (sem rede). O dublê lê
# as respostas por resolver de $DUBLE_DNS/<ip> (arquivo ausente = sem resposta).
EXPECTED_EXIT=0
run_guard(){
  local m="$VERIFY_DIR/dns-multi-region.sh" p="$VERIFY_DIR/dns-propagation.sh" ip
  export DUBLE_DNS="$SCN_TMP/dns"; mkdir -p "$DUBLE_DNS"
  dubla dig <<'EOS'
ip=""; for a in "$@"; do case "$a" in @*) ip="${a#@}" ;; esac; done
echo "$*" >>"$DUBLE_DNS/chamadas.log"
[[ -f "$DUBLE_DNS/$ip" ]] && cat "$DUBLE_DNS/$ip"
exit 0
EOS
  responde(){ local ip; for ip in 8.8.8.8 8.8.4.4 1.1.1.1 1.0.0.1 9.9.9.9 149.112.112.112 208.67.222.222 208.67.220.220 64.6.64.6 77.88.8.8 223.5.5.5 180.76.76.76; do printf '%s\n' "$@" >"$DUBLE_DNS/$ip"; done; }
  # ── multi-region ──
  responde 203.0.113.10
  DOMAIN=app.exemplo.test EXPECTED=203.0.113.10 espera_saida 0 bash "$m" >"$SCN_TMP/m0.log" 2>&1 || { cat "$SCN_TMP/m0.log"; return 1; }
  contem "$SCN_TMP/m0.log" 'Todos os 12 resolvers' || return 1
  # IP parecido NÃO pode casar (o original usava "contém": 203.0.113.1 casava com 203.0.113.10)
  DOMAIN=app.exemplo.test EXPECTED=203.0.113.1 espera_saida 1 bash "$m" >"$SCN_TMP/m1.log" 2>&1 || return 1
  contem "$SCN_TMP/m1.log" '12 resolvers ainda não propagaram' || return 1
  # CNAME + vários A: qualquer linha vale (o original só olhava a última)
  responde alvo.cdn.exemplo.test. 203.0.113.10 203.0.113.99
  DOMAIN=app.exemplo.test EXPECTED=203.0.113.10 espera_saida 0 bash "$m" >/dev/null 2>&1 || return 1
  DOMAIN=app.exemplo.test EXPECTED=CDN.exemplo.test espera_saida 0 bash "$m" >/dev/null 2>&1 || return 1
  # um resolver divergente e um mudo → 1, citando os dois
  echo 198.51.100.7 >"$DUBLE_DNS/77.88.8.8"; rm "$DUBLE_DNS/180.76.76.76"
  printf ';; communications error to 9.9.9.9#53: timed out\n;; no servers could be reached\n' >"$DUBLE_DNS/9.9.9.9"
  DOMAIN=app.exemplo.test EXPECTED=203.0.113.10 espera_saida 1 bash "$m" >"$SCN_TMP/m2.log" 2>&1 || return 1
  contem "$SCN_TMP/m2.log" 'Yandex-RU \(77.88.8.8\): 198.51.100.7' || return 1
  contem "$SCN_TMP/m2.log" 'Baidu-CN \(180.76.76.76\): SEM RESPOSTA' || return 1
  contem "$SCN_TMP/m2.log" 'Quad9-EU \(9.9.9.9\): SEM RESPOSTA' || return 1     # diagnóstico do dig não é resposta
  contem "$SCN_TMP/m2.log" '3 resolvers ainda não propagaram' || return 1
  DOMAIN=x.test espera_saida 2 bash "$m" >/dev/null 2>&1 || return 1             # EXPECTED ausente
  DNS_RESOLVERS="8.8.8.8 SoUm" DOMAIN=app.exemplo.test EXPECTED=203.0.113.10 espera_saida 0 bash "$m" >"$SCN_TMP/m3.log" 2>&1 || return 1
  contem "$SCN_TMP/m3.log" 'Todos os 1 resolvers' || return 1
  # ── propagation ──
  responde 203.0.113.10
  espera_saida 0 bash "$p" app.exemplo.test 203.0.113.10 5 >"$SCN_TMP/p0.log" 2>&1 || { cat "$SCN_TMP/p0.log"; return 1; }
  contem "$SCN_TMP/p0.log" '6/6 resolvers propagados' || return 1
  echo 198.51.100.7 >"$DUBLE_DNS/223.5.5.5"
  DNS_POLL_INTERVAL=1 espera_saida 1 bash "$p" app.exemplo.test 203.0.113.10 2 >"$SCN_TMP/p1.log" 2>&1 || return 1
  contem "$SCN_TMP/p1.log" 'TIMEOUT após 2s: 5/6' || return 1
  [[ "$(grep -c 'resolvendo' "$SCN_TMP/p1.log")" -ge 2 ]] || { echo "não repetiu a rodada"; return 1; }
  # propaga no meio da espera → sai 0 na rodada seguinte
  ( sleep 1.5; echo 203.0.113.10 >"$DUBLE_DNS/223.5.5.5" ) &
  DNS_POLL_INTERVAL=1 espera_saida 0 bash "$p" app.exemplo.test 203.0.113.10 20 >"$SCN_TMP/p2.log" 2>&1 || { cat "$SCN_TMP/p2.log"; return 1; }
  wait
  espera_saida 2 bash "$p" >/dev/null 2>&1 || return 1
  espera_saida 2 bash "$p" app.exemplo.test 203.0.113.10 abc >/dev/null 2>&1 || return 1
  # sem dig no PATH: erro claro (2), não "SEM RESPOSTA" em todos os resolvers
  rm "$SCN_TMP/bin/dig"
  if ! command -v dig >/dev/null 2>&1; then
    DOMAIN=x.test EXPECTED=1.2.3.4 espera_saida 2 bash "$m" >"$SCN_TMP/semdig.log" 2>&1 || return 1
    contem "$SCN_TMP/semdig.log" 'dig requerido' || return 1
    espera_saida 2 bash "$p" x.test 1.2.3.4 1 >/dev/null 2>&1 || return 1
  fi
  # nenhuma consulta escapou para a rede: todas passaram pelo dublê
  [[ "$(wc -l <"$DUBLE_DNS/chamadas.log")" -ge 60 ]]
}
