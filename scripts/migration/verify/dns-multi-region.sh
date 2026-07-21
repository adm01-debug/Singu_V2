#!/usr/bin/env bash
# DNS Multi-Region Verifier — consulta 12 resolvers globais.
# Uso: DOMAIN=harmony-bank.lovable.app EXPECTED=... ./verify/dns-multi-region.sh
set -euo pipefail

: "${DOMAIN:?defina DOMAIN}"
: "${EXPECTED:?defina EXPECTED (IP ou CNAME esperado)}"

RESOLVERS=(
  "8.8.8.8         Google-US"
  "8.8.4.4         Google-US2"
  "1.1.1.1         Cloudflare-Global"
  "1.0.0.1         Cloudflare-Global2"
  "9.9.9.9         Quad9-EU"
  "149.112.112.112 Quad9-EU2"
  "208.67.222.222  OpenDNS-US"
  "208.67.220.220  OpenDNS-US2"
  "64.6.64.6       Verisign-US"
  "77.88.8.8       Yandex-RU"
  "223.5.5.5       AliDNS-CN"
  "180.76.76.76    Baidu-CN"
)

log() { printf '[dns %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

fail=0
for row in "${RESOLVERS[@]}"; do
  ip="$(echo "$row" | awk '{print $1}')"
  name="$(echo "$row" | awk '{print $2}')"
  result="$(dig @"$ip" +short +time=3 +tries=1 "$DOMAIN" 2>/dev/null | tail -n1 || true)"
  if [[ -z "$result" ]]; then
    log "✖ $name ($ip): SEM RESPOSTA"; fail=$((fail+1))
  elif [[ "$result" == *"$EXPECTED"* ]]; then
    log "✔ $name ($ip): $result"
  else
    log "✖ $name ($ip): $result (esperado *$EXPECTED*)"; fail=$((fail+1))
  fi
done

if (( fail > 0 )); then
  log "🚨 $fail resolvers ainda não propagaram — NÃO fazer cutover"; exit 1
fi
log "✔ Todos os 12 resolvers propagaram $DOMAIN → *$EXPECTED*"