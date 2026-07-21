#!/usr/bin/env bash
# =============================================================================
# set-secrets.sh — aplica secrets no NOVO projeto Supabase (destino).
#
# Uso:
#   ./set-secrets.sh                 # aplica
#   ./set-secrets.sh --dry-run       # apenas lista o que seria enviado
#
# Pré-requisitos:
#   - supabase CLI logado (`supabase login`)
#   - Variável DEST_REF exportada com o project-ref de destino
#     (ou informar via --project-ref <ref>)
#   - Arquivo secrets.env preenchido a partir de secrets.template.env
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/secrets.env"
DRY_RUN=0
PROJECT_REF="${DEST_REF:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --project-ref) PROJECT_REF="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$PROJECT_REF" ]]; then
  echo "ERRO: informe DEST_REF ou --project-ref <ref>" >&2
  exit 2
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: arquivo não encontrado: $ENV_FILE" >&2
  echo "Copie de secrets.template.env e preencha os valores." >&2
  exit 2
fi

# Nomes bloqueados: reservados pelo Supabase (não podem ser definidos).
RESERVED=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_DB_URL)

is_reserved() {
  local name="$1"
  for r in "${RESERVED[@]}"; do
    [[ "$name" == "$r" ]] && return 0
  done
  return 1
}

TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

SENT=0
SKIPPED_EMPTY=0
SKIPPED_RESERVED=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # remove CR do windows
  line="${line%$'\r'}"
  # ignora comentários e linhas vazias
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" != *=* ]] && continue
  name="${line%%=*}"
  value="${line#*=}"
  name="$(echo -n "$name" | tr -d '[:space:]')"

  if is_reserved "$name"; then
    echo "  ~ pulando $name (reservado pelo Supabase)"
    SKIPPED_RESERVED=$((SKIPPED_RESERVED+1))
    continue
  fi
  if [[ -z "$value" ]]; then
    echo "  ~ pulando $name (vazio)"
    SKIPPED_EMPTY=$((SKIPPED_EMPTY+1))
    continue
  fi
  echo "$name=$value" >> "$TMP_ENV"
  echo "  + $name"
  SENT=$((SENT+1))
done < "$ENV_FILE"

echo
echo "Resumo: enviar=$SENT | vazios=$SKIPPED_EMPTY | reservados=$SKIPPED_RESERVED"
echo "Destino: project-ref=$PROJECT_REF"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] nada foi aplicado."
  exit 0
fi

if [[ "$SENT" -eq 0 ]]; then
  echo "Nada para aplicar."
  exit 0
fi

echo "Aplicando via supabase secrets set --env-file ..."
supabase secrets set --project-ref "$PROJECT_REF" --env-file "$TMP_ENV"
echo "Concluído."