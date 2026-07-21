#!/usr/bin/env bash
# Secrets Leak Scanner — bloqueia deploy se encontrar secrets hardcoded em edge functions.
# Uso: ./functions/secrets-leak-scan.sh [dir]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TARGET="${1:-$ROOT_DIR/supabase/functions}"

log() { printf '[leak-scan %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

if [[ ! -d "$TARGET" ]]; then
  log "diretório não encontrado: $TARGET"; exit 2
fi

# Padrões críticos
PATTERNS=(
  # JWT service_role literal (eyJ... com role service_role)
  'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
  # SUPABASE_*_KEY = "..." hardcoded
  '(SUPABASE|LOVABLE|LEGACY|DEST)_[A-Z_]*KEY\s*[:=]\s*["'\''][^"'\'']{20,}'
  # service_role atribuído a string literal
  'service_role["'\'' ]*[:=][ ]*["'\''][A-Za-z0-9._-]{20,}'
  # AWS access key ids
  'AKIA[0-9A-Z]{16}'
  # Private key blocks
  '-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----'
)

found=0
report="$(mktemp)"
for p in "${PATTERNS[@]}"; do
  if grep -REn --include='*.ts' --include='*.js' --include='*.tsx' \
       --exclude-dir='node_modules' -P "$p" "$TARGET" >> "$report" 2>/dev/null; then
    found=1
  fi
done

# Falso-positivo: Deno.env.get("...") é permitido (leitura, não hardcode)
filtered="$(mktemp)"
grep -v 'Deno\.env\.get' "$report" > "$filtered" || true

if [[ -s "$filtered" ]]; then
  log "🚨 SECRETS HARDCODED DETECTADOS — bloqueando deploy"
  cat "$filtered"
  rm -f "$report" "$filtered"
  exit 1
fi

rm -f "$report" "$filtered"
log "✔ Nenhum secret hardcoded encontrado em $TARGET"