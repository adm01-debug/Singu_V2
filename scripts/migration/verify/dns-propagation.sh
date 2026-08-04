#!/usr/bin/env bash
# dns-propagation.sh — Verifica propagação DNS em múltiplos resolvers globais.
# Uso: ./verify/dns-propagation.sh <dominio> <ip_esperado> [max_wait_seg=1800]
set -euo pipefail

DOMAIN="${1:?dominio obrigatório}"
EXPECTED="${2:?ip esperado obrigatório}"
MAX_WAIT="${3:-1800}"

RESOLVERS=(
  "1.1.1.1|Cloudflare"
  "8.8.8.8|Google"
  "9.9.9.9|Quad9"
  "208.67.222.222|OpenDNS"
  "77.88.8.8|Yandex"
  "223.5.5.5|AliDNS"
)

started=$(date +%s)
while :; do
  ok=0; total=0
  echo "── $(date -u +%H:%M:%SZ) resolvendo $DOMAIN → esperado $EXPECTED ──"
  for r in "${RESOLVERS[@]}"; do
    ip="${r%|*}"; name="${r#*|}"
    total=$((total+1))
    got=$(dig @"$ip" +short +time=3 +tries=1 "$DOMAIN" A | tail -n1 || true)
    if [[ "$got" == "$EXPECTED" ]]; then
      printf '  ✅ %-12s %-20s → %s\n' "$name" "$ip" "$got"
      ok=$((ok+1))
    else
      printf '  ❌ %-12s %-20s → %s\n' "$name" "$ip" "${got:-<sem resposta>}"
    fi
  done
  echo "→ $ok/$total resolvers propagados"
  if [[ "$ok" == "$total" ]]; then
    echo "DNS totalmente propagado."
    exit 0
  fi
  now=$(date +%s)
  if (( now - started > MAX_WAIT )); then
    echo "TIMEOUT após ${MAX_WAIT}s: $ok/$total propagados."
    exit 1
  fi
  sleep 30
done