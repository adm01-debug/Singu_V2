#!/usr/bin/env bash
# Preflight: valida que TODA Deno.env.get("X") usada nas edge functions
# está declarada em secrets.template.env.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TEMPLATE="$SCRIPT_DIR/secrets.template.env"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "✖ $TEMPLATE não encontrado"; exit 2
fi

# Segredos reservados que o Supabase injeta automaticamente
RESERVED='^(SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_URL|SUPABASE_PUBLISHABLE_KEY|SB_.*)$'

echo "▶ Extraindo Deno.env.get(...) de supabase/functions/**/index.ts"
USED=$(grep -hoE 'Deno\.env\.get\(\s*["'\''][A-Z0-9_]+["'\'']' "$REPO_ROOT"/supabase/functions/*/index.ts \
  | grep -oE '[A-Z][A-Z0-9_]+' | sort -u \
  | grep -Ev "$RESERVED" || true)

DECLARED=$(grep -oE '^[A-Z0-9_]+' "$TEMPLATE" | sort -u)

echo "▶ Diff (usado no código × declarado no template):"
MISSING=$(comm -23 <(echo "$USED") <(echo "$DECLARED"))
EXTRA=$(comm -13 <(echo "$USED") <(echo "$DECLARED"))

if [[ -n "$MISSING" ]]; then
  echo "✖ FALTANDO no template (código usa mas template não declara):"
  echo "$MISSING" | sed 's/^/  - /'
fi
if [[ -n "$EXTRA" ]]; then
  echo "ℹ Extras no template (não usados no código atual — ok manter):"
  echo "$EXTRA" | sed 's/^/  - /'
fi

if [[ -n "$MISSING" ]]; then
  echo ""
  echo "✖ Preflight falhou. Adicione as variáveis faltantes a $TEMPLATE antes do deploy."
  exit 1
fi
echo "✔ Todos os secrets usados estão declarados."
