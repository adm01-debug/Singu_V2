#!/usr/bin/env bash
# =============================================================================
# set-secrets.sh — aplica secrets no NOVO projeto Supabase (destino).
#
# Uso:
#   ./set-secrets.sh --dry-run       # valida e lista OS NOMES que seriam enviados
#   ./set-secrets.sh                 # aplica (pede confirmação)
#   ./set-secrets.sh --yes           # aplica sem pergunta
#   ./set-secrets.sh --project-ref <ref> --env-file <arquivo> [--no-verify]
#
# Pré-requisitos:
#   - supabase CLI logado (`supabase login`)
#   - DEST_REF (ou NEW_REF) com o project-ref de destino, ou --project-ref
#   - secrets.env preenchido a partir de secrets.template.env
#     (ou SECRETS_ENV=<arquivo> / --env-file)
#
# Tudo ou nada: o arquivo é validado INTEIRO antes de qualquer envio (linha sem
# `=`, nome inválido ou duplicado abortam com exit 2); os secrets vão num único
# `supabase secrets set --env-file` e, depois, `supabase secrets list` confere
# que todos os nomes existem no destino. Valores nunca são impressos nem vão
# para a linha de comando; o arquivo temporário é 600 e apagado na saída.
# Exit: 0 ok · 1 a CLI falhou ou a conferência não achou algum secret
#       · 2 uso/config/arquivo inválido/confirmação negada.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$SCRIPT_DIR/../_lib.sh"
MIG_TAG="set-secrets"

mig_load_env "$SCRIPT_DIR/../.env" "$SCRIPT_DIR/../env.migration"
ENV_FILE="${SECRETS_ENV:-${SCRIPT_DIR}/secrets.env}"
DRY_RUN=0; VERIFY=1
PROJECT_REF="${DEST_REF:-${NEW_REF:-}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --yes) MIG_YES=1; shift ;;
    --no-verify) VERIFY=0; shift ;;
    --project-ref) mig_opt_arg "$1" $#; PROJECT_REF="$2"; shift 2 ;;
    --env-file) mig_opt_arg "$1" $#; ENV_FILE="$2"; shift 2 ;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "Argumento desconhecido: $1 (veja --help)" ;;
  esac
done

[[ -n "$PROJECT_REF" ]] || mig_die 2 "ERRO: informe DEST_REF ou --project-ref <ref>"
[[ "$PROJECT_REF" =~ ^[a-z0-9]{15,30}$ ]] || mig_die 2 "project-ref inválido: $PROJECT_REF"
if [[ ! -f "$ENV_FILE" ]]; then
  mig_die 2 "ERRO: arquivo não encontrado: $ENV_FILE — copie de secrets.template.env e preencha os valores."
fi

TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT
trap 'exit 130' INT TERM

# dotenv_quote <valor> — forma que o parser de --env-file lê de volta literal.
dotenv_quote() {
  local v="$1"
  if [[ "$v" =~ ^[A-Za-z0-9_./:@%+=,~-]*$ ]]; then printf '%s' "$v"       # simples: sem aspas
  elif [[ "$v" != *"'"* ]]; then printf "'%s'" "$v"                        # aspas simples = literal
  else v="${v//\\/\\\\}"; v="${v//\"/\\\"}"; v="${v//\$/\\\$}"; printf '"%s"' "$v"
  fi
}

SENT=0; SKIPPED_EMPTY=0; SKIPPED_RESERVED=0; ERRORS=0; LINENO_F=0
NAMES=()
declare -A SEEN=()
while IFS= read -r line || [[ -n "$line" ]]; do
  LINENO_F=$((LINENO_F+1))
  line="${line%$'\r'}"
  [[ -z "${line//[[:space:]]/}" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ ! "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
    mig_err "linha $LINENO_F inválida (esperado NOME=valor)"; ERRORS=$((ERRORS+1)); continue
  fi
  name="${BASH_REMATCH[2]}"; value="${BASH_REMATCH[3]}"
  # tira espaços das pontas; aspas que envolvem o valor inteiro são só delimitadores
  value="${value#"${value%%[![:space:]]*}"}"; value="${value%"${value##*[![:space:]]}"}"
  if [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]]; then value="${BASH_REMATCH[1]}"; fi

  if [[ "$name" == SUPABASE_* ]]; then
    echo "  ~ pulando $name (prefixo SUPABASE_ é reservado pelo Supabase)"
    SKIPPED_RESERVED=$((SKIPPED_RESERVED+1)); continue
  fi
  if [[ -n "${SEEN[$name]+x}" ]]; then
    mig_err "linha $LINENO_F: $name duplicado (já definido na linha ${SEEN[$name]})"; ERRORS=$((ERRORS+1)); continue
  fi
  SEEN[$name]=$LINENO_F
  if [[ -z "$value" ]]; then
    echo "  ~ pulando $name (vazio)"
    SKIPPED_EMPTY=$((SKIPPED_EMPTY+1)); continue
  fi
  if [[ "$value" == *$'\n'* ]]; then mig_err "linha $LINENO_F: valor multilinha não suportado"; ERRORS=$((ERRORS+1)); continue; fi
  printf '%s=%s\n' "$name" "$(dotenv_quote "$value")" >> "$TMP_ENV"
  echo "  + $name"
  NAMES+=("$name"); SENT=$((SENT+1))
done < "$ENV_FILE"

if (( ERRORS > 0 )); then
  mig_die 2 "$ERRORS erro(s) em $ENV_FILE — nada foi enviado. Corrija e rode de novo."
fi

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
mig_need supabase
mig_confirm "Isto SOBRESCREVE $SENT secret(s) das Edge Functions do projeto $PROJECT_REF." "$PROJECT_REF"

echo "Aplicando via supabase secrets set --env-file ..."
if ! supabase secrets set --project-ref "$PROJECT_REF" --env-file "$TMP_ENV" 2>&1 | mig_redact; then
  mig_die 1 "supabase secrets set falhou — confira com: supabase secrets list --project-ref $PROJECT_REF"
fi

if (( VERIFY )); then
  listed="$(supabase secrets list --project-ref "$PROJECT_REF" 2>/dev/null)" \
    || mig_die 1 "secrets enviados, mas NÃO consegui conferir (supabase secrets list falhou)"
  absent=()
  for n in "${NAMES[@]}"; do
    grep -qE "(^|[^A-Za-z0-9_])${n}([^A-Za-z0-9_]|\$)" <<<"$listed" || absent+=("$n")
  done
  if [[ ${#absent[@]} -gt 0 ]]; then
    mig_die 1 "aplicação PARCIAL — ausentes no destino: ${absent[*]}"
  fi
  echo "Conferido: $SENT/$SENT secret(s) presentes no destino."
fi
echo "Concluído."
