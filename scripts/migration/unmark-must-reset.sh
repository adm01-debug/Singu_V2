#!/usr/bin/env bash
# ============================================================================
# unmark-must-reset.sh
# ----------------------------------------------------------------------------
# Rollback: remove a flag must_reset_password (e migrated_at) de usuários do
# BANCO DE DESTINO. Idempotente: rodar de novo não muda nada.
#
# Uso:
#   ./scripts/migration/unmark-must-reset.sh user@exemplo.com [outro@ex.com ...]
#   ./scripts/migration/unmark-must-reset.sh --all            # todos (pergunta "yes")
#   ./scripts/migration/unmark-must-reset.sh --all --yes      # todos, sem pergunta
#   ./scripts/migration/unmark-must-reset.sh --all --dry-run  # só conta os afetados
#
# Ambiente (scripts/migration/env.migration ou .env; ambiente vence):
#   DEST_DB_URL (ou TARGET_DB_URL) — obrigatória
# Exit: 0 ok · 1 falha, ou algum e-mail informado não existe · 2 uso/config ou
#       confirmação negada.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$SCRIPT_DIR/_lib.sh"
MIG_TAG="unmark"

ALL=0; DRY_RUN=0; YES=0; EMAILS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)     ALL=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --yes)     YES=1; shift ;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    -*)        mig_die 2 "opção desconhecida: $1 (veja --help)" ;;
    *)         EMAILS+=("$1"); shift ;;
  esac
done
if (( ALL == 0 )) && [[ ${#EMAILS[@]} -eq 0 ]]; then
  mig_die 2 "Uso: $0 <email> [email...] | --all [--yes] [--dry-run]"
fi
if (( ALL == 1 )) && [[ ${#EMAILS[@]} -gt 0 ]]; then mig_die 2 "use --all OU uma lista de e-mails, não os dois"; fi

mig_load_env "$SCRIPT_DIR/env.migration" "$SCRIPT_DIR/.env"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "DEST_DB_URL (ou TARGET_DB_URL) não definido — veja env.example"
mig_need psql
TARGET="$(mig_target "$DEST_DB_URL")"

q() { mig_psql "$DEST_DB_URL" -XAtq -v ON_ERROR_STOP=1 "$@"; }

if (( ALL )); then
  pend="$(q -c "SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password'")" \
    || mig_die 1 "não consegui consultar auth.users em $TARGET"
  mig_log "$pend usuário(s) com a flag em $TARGET"
  if (( DRY_RUN )); then mig_log "dry-run: nada foi alterado"; exit 0; fi
  if (( YES == 0 )); then
    read -r -p "Confirmar remoção da flag em TODOS os usuários? (yes/NO) " confirm || confirm=""
    [[ "${confirm}" == "yes" ]] || mig_die 2 "abortado — nada foi alterado."
  fi
  rest="$(q <<'SQL'
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'must_reset_password' - 'migrated_at'
WHERE raw_user_meta_data ? 'must_reset_password';
SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'must_reset_password';
SQL
)" || mig_die 1 "UPDATE falhou em $TARGET"
  [[ "$rest" == "0" ]] || mig_die 1 "ainda restam $rest usuário(s) com a flag"
  mig_log "[ok] flag removida de $pend usuário(s); restantes: 0"
  exit 0
fi

not_found=0
for email in "${EMAILS[@]}"; do
  # e-mail entra como variável do psql (:'email') — nunca interpolado no SQL
  res="$(q -v email="$email" -v dry="$DRY_RUN" <<'SQL'
WITH alvo AS (
  SELECT id, raw_user_meta_data ? 'must_reset_password' AS marcada
  FROM auth.users WHERE lower(email) = lower(:'email')
), upd AS (
  UPDATE auth.users u
  SET raw_user_meta_data = u.raw_user_meta_data - 'must_reset_password' - 'migrated_at'
  FROM alvo a WHERE u.id = a.id AND a.marcada AND :dry = 0
  RETURNING 1
)
SELECT (SELECT count(*) FROM alvo) || ' ' || (SELECT count(*) FROM alvo WHERE marcada);
SQL
)" || mig_die 1 "falha ao atualizar $email em $TARGET"
  read -r found flagged <<<"$res"
  if [[ "$found" == "0" ]]; then
    mig_err "[erro] $email: usuário não encontrado"; not_found=$((not_found+1))
  elif (( DRY_RUN )); then
    mig_log "[dry-run] $email: $flagged com a flag (nada alterado)"
  elif [[ "$flagged" == "0" ]]; then
    mig_log "[ok] $email: já estava sem a flag"
  else
    mig_log "[ok] $email: flag removida"
  fi
done
if (( not_found > 0 )); then mig_die 1 "$not_found e-mail(s) não encontrado(s)"; fi
mig_log "[ok] Concluído."
