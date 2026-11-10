#!/usr/bin/env bash
# ============================================================================
# import-identities.sh — importa auth.identities no DESTINO. Idempotente
# (ON CONFLICT DO NOTHING) e atômico (uma transação).
#
# Uso:
#   ./auth/import-identities.sh             # importa (pede confirmação)
#   ./auth/import-identities.sh --dry-run   # valida e mostra o que entraria; ROLLBACK
#   ./auth/import-identities.sh --yes       # sem pergunta
# Ambiente (scripts/migration/.env; ambiente vence):
#   DEST_DB_URL (ou TARGET_DB_URL)  destino — obrigatória
#   IN                              CSV de entrada (padrão ./auth-identities.csv)
#   CONFIRM=<host:porta/banco>      confirma sem terminal
#
# Pré-requisito: auth.users já importado — identity sem usuário no destino
# aborta tudo. Colunas geradas no destino (ex.: email) são recalculadas.
# Exit: 0 ok · 1 falha (nada gravado) · 2 uso/config/confirmação.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"
MIG_TAG="identities-import"

DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --yes)     MIG_YES=1; shift ;;
    -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
    *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
  esac
done

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias DEST_DB_URL TARGET_DB_URL
[[ -n "${DEST_DB_URL:-}" ]] || mig_die 2 "defina DEST_DB_URL"
IN="${IN:-./auth-identities.csv}"
[[ -f "$IN" ]] || mig_die 2 "$IN não encontrado — rode export-identities.sh"
mig_need psql

TARGET="$(mig_target "$DEST_DB_URL")"
END="COMMIT"
if (( DRY_RUN )); then END="ROLLBACK"; else mig_confirm "Isto INSERE identities em auth.identities de $TARGET." "$TARGET"; fi

COLS="id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at, email, provider_id"
# O CSV entra por stdin (\copy FROM STDIN): o caminho do arquivo nunca vira SQL.
out="$(mig_psql "$DEST_DB_URL" -XAtq -v ON_ERROR_STOP=1 \
  -c "BEGIN" \
  -c "CREATE TEMP TABLE _idents (LIKE auth.identities) ON COMMIT DROP" \
  -c "\\copy _idents ($COLS) FROM STDIN WITH (FORMAT csv, HEADER true)" \
  -c "DO \$\$
DECLARE cols text; orphans bigint;
BEGIN
  SELECT count(*) INTO orphans FROM _idents i WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.user_id);
  IF orphans > 0 THEN
    RAISE EXCEPTION '% identity(ies) sem usuario correspondente em auth.users do destino - importe os usuarios antes', orphans;
  END IF;
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum) INTO cols
  FROM pg_attribute
  WHERE attrelid = 'auth.identities'::regclass AND attnum > 0 AND NOT attisdropped AND attgenerated = ''
    AND attname IN ('id','user_id','provider','identity_data','last_sign_in_at','created_at','updated_at','email','provider_id');
  EXECUTE format('CREATE TEMP TABLE _idents_ins ON COMMIT DROP AS WITH ins AS (INSERT INTO auth.identities (%s) SELECT %s FROM _idents ON CONFLICT DO NOTHING RETURNING 1) SELECT count(*) AS n FROM ins', cols, cols);
END \$\$" \
  -c "SELECT (SELECT count(*) FROM _idents) || ' ' || (SELECT n FROM _idents_ins)" \
  -c "$END" < "$IN")" || mig_die 1 "import falhou — transação desfeita, nada foi gravado em $TARGET"

read -r lidas inseridas <<<"$out"
if (( DRY_RUN )); then
  mig_log "dry-run: $lidas lida(s), $inseridas entrariam, $((lidas - inseridas)) já existem — nada foi gravado"
else
  mig_log "✔ import concluído: $lidas lida(s), $inseridas inserida(s), $((lidas - inseridas)) já existiam"
fi
