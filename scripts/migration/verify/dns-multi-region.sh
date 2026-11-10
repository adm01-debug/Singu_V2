#!/usr/bin/env bash
# DNS Multi-Region Verifier — consulta 12 resolvers globais.
# Uso: DOMAIN=harmony-bank.lovable.app EXPECTED=... ./verify/dns-multi-region.sh
#
# EXPECTED: se for um IP completo (v4/v6) exige resposta IDÊNTICA em alguma linha do dig
#           (1.2.3.4 não casa com 11.2.3.45); caso contrário vale como trecho de CNAME
#           (comparação por "contém", sem diferenciar maiúsculas, ignorando o ponto final).
# Variáveis opcionais: RECORD_TYPE (default A), DIG_TIMEOUT (default 3 s por resolver),
#   DNS_RESOLVERS ("ip nome" separados por vírgula, para trocar a lista padrão).
# Códigos de saída: 0 = todos propagaram; 1 = algum resolver diverge/não respondeu;
#                   2 = erro de uso ou dig ausente. Só faz consultas DNS.
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0
fi
[[ -n "${DOMAIN:-}" ]]   || { echo "✖ defina DOMAIN" >&2; exit 2; }
[[ -n "${EXPECTED:-}" ]] || { echo "✖ defina EXPECTED (IP ou CNAME esperado)" >&2; exit 2; }
command -v dig >/dev/null || { echo "✖ dig requerido (pacote dnsutils/bind-tools)" >&2; exit 2; }
RECORD_TYPE="${RECORD_TYPE:-A}"
DIG_TIMEOUT="${DIG_TIMEOUT:-3}"
[[ "$DIG_TIMEOUT" =~ ^[1-9][0-9]*$ ]] || { echo "✖ DIG_TIMEOUT inválido: $DIG_TIMEOUT" >&2; exit 2; }

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
if [[ -n "${DNS_RESOLVERS:-}" ]]; then
  IFS=',' read -r -a RESOLVERS <<<"$DNS_RESOLVERS"
fi

log() { printf '[dns %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
normaliza() { local v="${1,,}"; printf '%s' "${v%.}"; }

ESPERADO="$(normaliza "$EXPECTED")"
if [[ "$ESPERADO" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ || ( "$ESPERADO" == *:* && "$ESPERADO" =~ ^[0-9a-f:.]+$ ) ]]; then
  MODO=exato
else
  MODO=contem
fi

# casa <respostas> — 0 se alguma linha da resposta bate com o esperado.
casa() {
  local linha
  while IFS= read -r linha; do
    linha="$(normaliza "$linha")"
    [[ -n "$linha" ]] || continue
    if [[ $MODO == exato ]]; then [[ "$linha" == "$ESPERADO" ]] && return 0
    else [[ "$linha" == *"$ESPERADO"* ]] && return 0; fi
  done <<<"$1"
  return 1
}

fail=0
for row in "${RESOLVERS[@]}"; do
  read -r ip name <<<"$row"
  [[ -n "${ip:-}" ]] || continue
  name="${name:-$ip}"
  # linhas iniciadas por ';' são diagnósticos do dig (timeout etc.), não respostas
  result="$(dig @"$ip" +short +time="$DIG_TIMEOUT" +tries=1 "$DOMAIN" "$RECORD_TYPE" 2>/dev/null | grep -v '^;' || true)"
  resumo="${result//$'\n'/ }"
  if [[ -z "$result" ]]; then
    log "✖ $name ($ip): SEM RESPOSTA"; fail=$((fail+1))
  elif casa "$result"; then
    log "✔ $name ($ip): $resumo"
  else
    log "✖ $name ($ip): $resumo (esperado *$EXPECTED*)"; fail=$((fail+1))
  fi
done

if (( fail > 0 )); then
  log "🚨 $fail resolvers ainda não propagaram — NÃO fazer cutover"; exit 1
fi
log "✔ Todos os ${#RESOLVERS[@]} resolvers propagaram $DOMAIN → *$EXPECTED*"
