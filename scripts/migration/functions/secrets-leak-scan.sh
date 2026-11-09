#!/usr/bin/env bash
# ============================================================================
# secrets-leak-scan.sh — bloqueia o deploy se houver segredo hardcoded nas
# edge functions. Somente leitura.
#
# Uso: ./functions/secrets-leak-scan.sh [dir]     (padrão: supabase/functions)
#
# Detecta: JWT literal (anon/service_role), token pessoal Supabase (sbp_),
# chave sb_secret_, URL de Postgres com senha, atribuição literal de *_KEY /
# service_role, AWS access key, bloco de chave privada, chaves Stripe/GitHub/
# Slack e segredo de webhook (whsec_). Varre todo arquivo de texto (exceto
# node_modules/.git). O valor achado é MASCARADO na saída.
# Arquivos de teste (*_test.ts, *.test.ts, tests/) não são publicados e ficam
# fora por padrão; LEAK_SCAN_INCLUDE_TESTS=1 os inclui.
# Para liberar uma linha de exemplo, acrescente nela: leak-scan:allow
# Exit: 0 limpo · 1 segredo encontrado · 2 uso (diretório inexistente).
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

case "${1:-}" in
  -h|--help) sed -n '2,/^[^#]/{/^#/!d;s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; exit 0 ;;
esac
TARGET="${1:-$ROOT_DIR/supabase/functions}"

log() { printf '[leak-scan %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

if [[ ! -d "$TARGET" ]]; then
  log "diretório não encontrado: $TARGET"; exit 2
fi

# nome|regex ERE (grep -E; nada de -P, que conflita com -E e não existe em todo grep)
# shellcheck disable=SC2016  # regex literal: "${}" faz parte da classe de caracteres
PATTERNS=(
  'jwt|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
  'supabase-access-token|sbp_[A-Za-z0-9]{30,}'
  'supabase-secret-key|sb_secret_[A-Za-z0-9_-]{20,}'
  'postgres-url-com-senha|postgres(ql)?://[A-Za-z0-9._%-]+:[^@[:space:]"'"'"'<>${}]{3,}@'
  'chave-atribuida|(SUPABASE|LOVABLE|LEGACY|DEST|SRC|EXTERNAL)_[A-Z_]*KEY[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{20,}'
  'service-role-literal|service_role["'"'"' ]*[:=][ ]*["'"'"'][A-Za-z0-9._-]{20,}'
  'aws-access-key|AKIA[0-9A-Z]{16}'
  'chave-privada|-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----'
  'stripe-key|(sk|rk)_live_[A-Za-z0-9]{20,}'
  'webhook-secret|whsec_[A-Za-z0-9]{24,}'
  'github-token|gh[pousr]_[A-Za-z0-9]{36,}'
  'slack-token|xox[baprs]-[A-Za-z0-9-]{10,}'
)

EXCLUDES=(--exclude-dir=node_modules --exclude-dir=.git)
if [[ "${LEAK_SCAN_INCLUDE_TESTS:-0}" != "1" ]]; then
  EXCLUDES+=(--exclude-dir=tests --exclude='*_test.ts' --exclude='*.test.ts' --exclude='*_test.js' --exclude='*.test.js')
fi

report="$(mktemp)"
trap 'rm -f "$report"' EXIT

for entry in "${PATTERNS[@]}"; do
  name="${entry%%|*}"; re="${entry#*|}"
  rc=0
  # -I ignora binário; -o imprime só o trecho casado (para mascarar)
  hits="$(grep -rIEno "${EXCLUDES[@]}" -e "$re" "$TARGET" 2>/dev/null)" || rc=$?
  if (( rc > 1 )); then log "erro do grep no padrão $name (código $rc)"; exit 2; fi
  [[ -n "$hits" ]] || continue
  while IFS= read -r hit; do
    file="${hit%%:*}"; rest="${hit#*:}"; line="${rest%%:*}"; match="${rest#*:}"
    # linha liberada explicitamente?
    if sed -n "${line}p" "$file" | grep -q 'leak-scan:allow'; then continue; fi
    printf '%s:%s: [%s] %s…(%d caracteres)\n' "${file#"$ROOT_DIR"/}" "$line" "$name" "${match:0:6}" "${#match}" >> "$report"
  done <<<"$hits"
done

if [[ -s "$report" ]]; then
  log "🚨 SECRETS HARDCODED DETECTADOS — bloqueando deploy"
  sort -u "$report"
  log "$(sort -u "$report" | wc -l | tr -d ' ') ocorrência(s). Mova o valor para um secret (set-secrets.sh) e ROTACIONE a chave exposta."
  exit 1
fi
log "✔ Nenhum secret hardcoded encontrado em $TARGET"
