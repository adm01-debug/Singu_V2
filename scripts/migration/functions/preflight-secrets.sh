#!/usr/bin/env bash
# ============================================================================
# preflight-secrets.sh — valida que TODO secret lido pelas edge functions está
# declarado em secrets.template.env. Somente leitura.
#
# Considera lido: Deno.env.get("X") em qualquer .ts de supabase/functions
# (inclui _shared; exclui testes) e o nome passado a
# requireWebhookSecret(req, "X", ...), que lê a variável indiretamente.
#
# Uso: ./functions/preflight-secrets.sh
# Ambiente (opcional): FUNCTIONS_DIR, SECRETS_TEMPLATE (para testes).
# Exit: 0 tudo declarado · 1 falta declarar algum · 2 arquivo/pasta ausente.
# ============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

case "${1:-}" in
  -h|--help) sed -n '2,/^[^#]/{/^#/!d;s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) echo "argumento desconhecido: $1" >&2; exit 2 ;;
esac

TEMPLATE="${SECRETS_TEMPLATE:-$SCRIPT_DIR/secrets.template.env}"
FUNCTIONS_DIR="${FUNCTIONS_DIR:-$REPO_ROOT/supabase/functions}"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "✖ $TEMPLATE não encontrado" >&2; exit 2
fi
if [[ ! -d "$FUNCTIONS_DIR" ]]; then
  echo "✖ $FUNCTIONS_DIR não encontrado" >&2; exit 2
fi

# Injetadas pelo runtime (Supabase/Deno) — não são secrets do projeto.
RESERVED='^(SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_URL|SUPABASE_PUBLISHABLE_KEY|SB_.*|DENO_.*)$'

echo "▶ Extraindo secrets lidos em $FUNCTIONS_DIR (sem arquivos de teste)"
SOURCES="$(grep -rlE 'Deno\.env\.get|requireWebhookSecret' --include='*.ts' \
  --exclude='*_test.ts' --exclude='*.test.ts' --exclude='*test-harness*' --exclude-dir=tests --exclude-dir=node_modules \
  "$FUNCTIONS_DIR" || true)"
USED=""
if [[ -n "$SOURCES" ]]; then
  USED="$( { printf '%s\n' "$SOURCES" | tr '\n' '\0' | xargs -0 grep -hoE \
      -e 'Deno\.env\.get\([[:space:]]*["'"'"'][A-Z0-9_]+["'"'"']' \
      -e 'requireWebhookSecret\([^,()]+,[[:space:]]*["'"'"'][A-Z0-9_]+["'"'"']' || true; } \
    | grep -oE '["'"'"'][A-Z][A-Z0-9_]+["'"'"']' | tr -d '"'"'" | sort -u \
    | grep -Ev "$RESERVED" || true)"
fi

DECLARED=$(grep -oE '^[A-Z0-9_]+' "$TEMPLATE" | sort -u)

echo "▶ Diff (usado no código × declarado no template):"
MISSING=$(comm -23 <(printf '%s\n' "$USED" | sed '/^$/d') <(printf '%s\n' "$DECLARED"))
EXTRA=$(comm -13 <(printf '%s\n' "$USED" | sed '/^$/d') <(printf '%s\n' "$DECLARED"))

if [[ -n "$MISSING" ]]; then
  echo "✖ FALTANDO no template (código usa mas template não declara):"
  printf '%s\n' "$MISSING" | while IFS= read -r l; do echo "  - $l"; done
fi
if [[ -n "$EXTRA" ]]; then
  echo "ℹ Extras no template (não usados no código atual — ok manter):"
  printf '%s\n' "$EXTRA" | while IFS= read -r l; do echo "  - $l"; done
fi

if [[ -n "$MISSING" ]]; then
  echo ""
  echo "✖ Preflight falhou. Adicione as variáveis faltantes a $TEMPLATE antes do deploy."
  exit 1
fi
echo "✔ Todos os secrets usados estão declarados."
