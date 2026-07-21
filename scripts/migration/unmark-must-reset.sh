#!/usr/bin/env bash
# ============================================================================
# unmark-must-reset.sh
# ----------------------------------------------------------------------------
# Rollback: remove a flag must_reset_password de usuários específicos.
#
# Uso:
#   ./scripts/migration/unmark-must-reset.sh user@exemplo.com [outro@ex.com ...]
#   ./scripts/migration/unmark-must-reset.sh --all         # remove de todos
#
# Requer psql apontado para o BANCO DE DESTINO (env.migration com PG*).
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="${SCRIPT_DIR}/env.migration"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[fatal] ${ENV_FILE} não encontrado."
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "${ENV_FILE}"; set +a

: "${TARGET_DB_URL:?TARGET_DB_URL não definido em env.migration}"

if [[ $# -eq 0 ]]; then
  echo "Uso: $0 <email> [email...] | --all"
  exit 1
fi

if [[ "$1" == "--all" ]]; then
  read -r -p "Confirmar remoção da flag em TODOS os usuários? (yes/NO) " confirm
  [[ "${confirm}" == "yes" ]] || { echo "abortado."; exit 1; }
  psql "${TARGET_DB_URL}" -v ON_ERROR_STOP=1 <<'SQL'
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'must_reset_password' - 'migrated_at'
WHERE (raw_user_meta_data->>'must_reset_password')::boolean IS TRUE;
SELECT count(*) AS remaining
FROM auth.users
WHERE (raw_user_meta_data->>'must_reset_password')::boolean IS TRUE;
SQL
  exit 0
fi

# Lista de emails
for email in "$@"; do
  echo "[info] Removendo flag de ${email}..."
  psql "${TARGET_DB_URL}" -v ON_ERROR_STOP=1 -v email="${email}" <<'SQL'
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'must_reset_password' - 'migrated_at'
WHERE lower(email) = lower(:'email');
SQL
done

echo "[ok] Concluído."