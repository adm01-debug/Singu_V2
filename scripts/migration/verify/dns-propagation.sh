#!/usr/bin/env bash
# dns-propagation.sh — Verifica propagação DNS em múltiplos resolvers globais.
# Uso: ./verify/dns-propagation.sh <dominio> <ip_esperado> [max_wait_seg=1800]
#
# Repete a consulta (registro A) até todos os resolvers devolverem o IP esperado em alguma
# linha da resposta, ou até estourar max_wait_seg.
# Variáveis opcionais: DNS_POLL_INTERVAL (default 30 s entre rodadas), DIG_TIMEOUT (default 3 s).
# Códigos de saída: 0 = propagado em todos; 1 = TIMEOUT; 2 = erro de uso ou dig ausente.
# Só faz consultas DNS.
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
DOMAIN="${1:-}"
EXPECTED="${2:-}"
MAX_WAIT="${3:-1800}"
[[ -n "$DOMAIN" ]]   || { echo "✖ dominio obrigatório (veja --help)" >&2; exit 2; }
[[ -n "$EXPECTED" ]] || { echo "✖ ip esperado obrigatório (veja --help)" >&2; exit 2; }
[[ "$MAX_WAIT" =~ ^[0-9]+$ ]] || { echo "✖ max_wait_seg inválido: $MAX_WAIT" >&2; exit 2; }
INTERVALO="${DNS_POLL_INTERVAL:-30}"
[[ "$INTERVALO" =~ ^[0-9]+$ ]] || { echo "✖ DNS_POLL_INTERVAL inválido: $INTERVALO" >&2; exit 2; }
DIG_TIMEOUT="${DIG_TIMEOUT:-3}"
[[ "$DIG_TIMEOUT" =~ ^[1-9][0-9]*$ ]] || { echo "✖ DIG_TIMEOUT inválido: $DIG_TIMEOUT" >&2; exit 2; }
command -v dig >/dev/null || { echo "✖ dig requerido (pacote dnsutils/bind-tools)" >&2; exit 2; }

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
    # linhas iniciadas por ';' são diagnósticos do dig (timeout etc.), não respostas
    got=$(dig @"$ip" +short +time="$DIG_TIMEOUT" +tries=1 "$DOMAIN" A 2>/dev/null | grep -v '^;' || true)
    if grep -Fxq -- "$EXPECTED" <<<"$got"; then
      printf '  ✅ %-12s %-20s → %s\n' "$name" "$ip" "$EXPECTED"
      ok=$((ok+1))
    else
      got="${got//$'\n'/ }"
      printf '  ❌ %-12s %-20s → %s\n' "$name" "$ip" "${got:-<sem resposta>}"
    fi
  done
  echo "→ $ok/$total resolvers propagados"
  if [[ "$ok" == "$total" ]]; then
    echo "DNS totalmente propagado."
    exit 0
  fi
  restante=$(( MAX_WAIT - ($(date +%s) - started) ))
  if (( restante <= 0 )); then
    echo "TIMEOUT após ${MAX_WAIT}s: $ok/$total propagados."
    exit 1
  fi
  sleep "$(( restante < INTERVALO ? restante : INTERVALO ))"
done
