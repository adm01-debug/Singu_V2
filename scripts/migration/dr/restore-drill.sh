#!/usr/bin/env bash
# Backup Restore Drill — restaura o backup mais recente em instância efêmera,
# roda smoke queries e compara contagens com o snapshot do dump.
# Uso: DRILL_DB_URL=... PROD_DB_URL=... BACKUP_FILE=... SOURCE_COUNTS_FILE=... ./dr/restore-drill.sh
#
# DESTRUTIVO só no DRILL_DB_URL (pg_restore --clean). A origem (PROD_DB_URL) é
# apenas consultada, e o script recusa rodar se origem e destino forem o mesmo
# cluster. Backup cifrado (GPG com BACKUP_PASSPHRASE, age com AGE_IDENTITY_FILE)
# é decriptado para um temporário 600 em DRILL_REPORT_DIR e apagado na saída;
# o SHA-256 do manifesto pode ser o do arquivo cifrado ou o do dump em claro.
# Senhas embutidas nas URLs não vão para a linha de comando (PGPASSWORD do filho).
# Opcionais: CRITICAL_TABLES, DRIFT_MAX_PCT (padrão 0), DRILL_REPORT_DIR.
# Exit: 0 restore + paridade ok · 1 restore/smoke falhou ou houve drift
#       · 2 preflight (env, arquivos, manifesto, conectividade, mesmo cluster)
#       · 130 interrompido.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

case "${1:-}" in
  -h|--help) sed -n '2,/^[^#]/{/^#/!d;s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; exit 0 ;;
esac

# Lê KEY=VALUE de scripts/migration/.env sem executar o arquivo; ambiente vence.
load_env() {
  local line key val
  [[ -f "$1" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    key="${BASH_REMATCH[2]}"; val="${BASH_REMATCH[3]}"
    if [[ "$val" =~ ^\"(.*)\"[[:space:]]*(#.*)?$ || "$val" =~ ^\'(.*)\'[[:space:]]*(#.*)?$ ]]; then val="${BASH_REMATCH[1]}"
    else val="${val%%[[:space:]]#*}"; val="${val%"${val##*[![:space:]]}"}"; fi
    [[ -n "${!key+x}" ]] || export "$key=$val"
  done < "$1"
}
load_env "$ROOT_DIR/.env"

# pgc <bin> <url> [args] — conexão com a senha da URL fora do argv (vai em PGPASSWORD
# só do processo filho). URL sem senha usa o PGPASSWORD/.pgpass do ambiente.
pgc() {
  local bin="$1" url="$2" pw; shift 2
  if [[ "$url" =~ ^(postgres(ql)?://)([^:@/]*):([^@/]*)@(.*)$ ]]; then
    pw="${BASH_REMATCH[4]//\\/\\\\}"; pw="$(printf '%b' "${pw//%/\\x}")"
    PGPASSWORD="$pw" "$bin" --dbname "${BASH_REMATCH[1]}${BASH_REMATCH[3]}@${BASH_REMATCH[5]}" "$@"
  else
    "$bin" --dbname "$url" "$@"
  fi
}

: "${PROD_DB_URL:?PROD_DB_URL obrigatório (produção read-only)}"
: "${DRILL_DB_URL:?DRILL_DB_URL obrigatório (instância efêmera de restore)}"
: "${BACKUP_FILE:?BACKUP_FILE obrigatório (arquivo local do backup mais recente)}"
: "${SOURCE_COUNTS_FILE:?SOURCE_COUNTS_FILE obrigatório (manifesto do snapshot)}"
: "${CRITICAL_TABLES:=contacts,deals,interactions,companies,whatsapp_messages,user_roles,profiles}"
: "${DRIFT_MAX_PCT:=0}"
umask 077

OUT_DIR="${DRILL_REPORT_DIR:-$SCRIPT_DIR/out}"
mkdir -p "$OUT_DIR"
REPORT=$(mktemp "$OUT_DIR/restore-drill-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
mv "$REPORT" "$REPORT.md"
REPORT="$REPORT.md"

log() { printf '[restore-drill %s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$REPORT"; }

cleanup() {
  log "🧹 limpando artefatos temporários"
  if [[ -n "${RESTORE_LOG:-}" ]]; then rm -f "$RESTORE_LOG"; fi
  if [[ -n "${TMP_DUMP:-}" ]]; then rm -f "$TMP_DUMP"; fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

log "# Backup Restore Drill — $(date -u +%FT%TZ)"
log "Conexões omitidas; origem e destino são validados antes da restauração."

# ── Fase 1: preflight ────────────────────────────────────────────────────
log "## Fase 1 — preflight"
for bin in psql pg_restore sha256sum awk; do
  command -v "$bin" >/dev/null || { log "✖ falta $bin no PATH"; exit 2; }
done
[[ -f "$BACKUP_FILE" ]] || { log "✖ backup não encontrado: $BACKUP_FILE"; exit 2; }
[[ -f "$SOURCE_COUNTS_FILE" ]] || { log "✖ manifesto não encontrado"; exit 2; }
[[ "$DRIFT_MAX_PCT" =~ ^[0-9]+([.][0-9]+)?$ ]] || { log "✖ limite de divergência inválido"; exit 2; }
declare -A COUNTS
expected_hash=''
snapshot=''
while IFS=$'\t' read -r key value extra; do
  [[ -z "$extra" ]] || { log "✖ manifesto inválido"; exit 2; }
  case "$key" in
    '#sha256')
      [[ -z "$expected_hash" && "$value" =~ ^[a-f0-9]{64}$ ]] || { log "✖ hash inválido"; exit 2; }
      expected_hash="$value" ;;
    '#snapshot')
      [[ -z "$snapshot" && "$value" =~ ^[A-Fa-f0-9]+-[A-Fa-f0-9]+-[0-9]+$ ]] || { log "✖ snapshot inválido"; exit 2; }
      snapshot="$value" ;;
    *)
      [[ "$key" =~ ^[a-z_][a-z0-9_]*$ && "$value" =~ ^(0|[1-9][0-9]*)$ ]] || { log "✖ contagem inválida"; exit 2; }
      [[ -z "${COUNTS[$key]+present}" ]] || { log "✖ tabela duplicada no manifesto"; exit 2; }
      COUNTS[$key]="$value" ;;
  esac
done < "$SOURCE_COUNTS_FILE"
[[ -n "$snapshot" && -n "$expected_hash" ]] || { log "✖ manifesto não corresponde ao backup"; exit 2; }
actual_hash=$(sha256sum "$BACKUP_FILE")
hash_ok=0
[[ "${actual_hash%% *}" == "$expected_hash" ]] && hash_ok=1
# Backup cifrado: decripta para temporário privado (apagado no cleanup).
DUMP_FILE="$BACKUP_FILE"
magic=$(head -c 1 "$BACKUP_FILE" | od -An -tx1 | tr -d ' \n')
first=$(head -c 64 "$BACKUP_FILE" | tr -d '\0' | head -c 40 || true)
enc=""
case "$magic" in 84|85|86|8c|8d|8e|c1|c3) enc="gpg" ;; esac
[[ "$first" == *"BEGIN PGP"* ]] && enc="gpg"
[[ "$first" == "age-encryption.org/v1"* || "$first" == "-----BEGIN AGE ENCRYPTED FILE"* ]] && enc="age"
if [[ -n "$enc" ]]; then
  command -v "$enc" >/dev/null || { log "✖ falta $enc no PATH para decriptar o backup"; exit 2; }
  TMP_DUMP=$(mktemp "$OUT_DIR/.drill-dump-XXXXXX")
  if [[ "$enc" == "gpg" ]]; then
    if [[ -n "${BACKUP_PASSPHRASE:-}" ]]; then
      printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 \
        --decrypt --output "$TMP_DUMP" "$BACKUP_FILE" 2>/dev/null || { log "✖ decrypt do backup falhou"; exit 2; }
    else
      gpg --batch --yes --decrypt --output "$TMP_DUMP" "$BACKUP_FILE" 2>/dev/null || { log "✖ decrypt do backup falhou"; exit 2; }
    fi
  else
    [[ -n "${AGE_IDENTITY_FILE:-}" && -f "${AGE_IDENTITY_FILE:-}" ]] || { log "✖ AGE_IDENTITY_FILE obrigatório para backup age"; exit 2; }
    age --decrypt -i "$AGE_IDENTITY_FILE" -o "$TMP_DUMP" "$BACKUP_FILE" 2>/dev/null || { log "✖ decrypt do backup falhou"; exit 2; }
  fi
  DUMP_FILE="$TMP_DUMP"
  if (( hash_ok == 0 )); then
    actual_hash=$(sha256sum "$TMP_DUMP")
    [[ "${actual_hash%% *}" == "$expected_hash" ]] && hash_ok=1
  fi
  log "✔ backup cifrado ($enc) decriptado para arquivo temporário"
fi
(( hash_ok == 1 )) || { log "✖ manifesto não corresponde ao backup"; exit 2; }
IFS=',' read -ra TBLS <<<"$CRITICAL_TABLES"
for t in "${TBLS[@]}"; do
  [[ "$t" =~ ^[a-z_][a-z0-9_]*$ ]] || { log "✖ nome de tabela inválido"; exit 2; }
  [[ -n "${COUNTS[$t]+present}" ]] || { log "✖ tabela ausente no manifesto: $t"; exit 2; }
done
pgc psql "$DRILL_DB_URL" -Atqc "SELECT 1" >/dev/null || { log "✖ DRILL_DB_URL inacessível"; exit 2; }
pgc psql "$PROD_DB_URL"  -Atqc "SELECT 1" >/dev/null || { log "✖ PROD_DB_URL inacessível"; exit 2; }
prod_cluster=$(pgc psql "$PROD_DB_URL" -Atqc 'SELECT system_identifier FROM pg_control_system()' 2>/dev/null) || {
  log "✖ origem exige EXECUTE em pg_catalog.pg_control_system(); consulte docs/dr-drills/README.md"; exit 2; }
drill_cluster=$(pgc psql "$DRILL_DB_URL" -Atqc 'SELECT system_identifier FROM pg_control_system()' 2>/dev/null) || {
  log "✖ destino exige EXECUTE em pg_catalog.pg_control_system()"; exit 2; }
[[ -n "$prod_cluster" && -n "$drill_cluster" && "$prod_cluster" != "$drill_cluster" ]] || {
  log "✖ origem e destino precisam ser instâncias PostgreSQL distintas"; exit 2; }
log "✔ binários e conectividade OK"

# ── Fase 2: restore no drill ─────────────────────────────────────────────
log "## Fase 2 — restore"
START_TS=$(date +%s)
RESTORE_LOG=$(mktemp "$OUT_DIR/.pg-restore-XXXXXX")
LC_ALL=C pgc pg_restore "$DRILL_DB_URL" --verbose --no-owner --no-privileges --clean --if-exists \
  "$DUMP_FILE" >"$RESTORE_LOG" 2>&1 || {
    log "✖ pg_restore falhou"
    awk '
      /^pg_restore: creating [A-Z ]+ "[A-Za-z0-9_.]+"$/ { object=$0 }
      /^pg_restore: processing data for table "[A-Za-z0-9_.]+"$/ { object=$0 }
      /pg_restore: error:/ { errors++; if (object != "") { print object; object="" } }
      /permission denied|must be owner/ { permission++ }
      /extension.*not available/ { extension++ }
      /already exists/ { existing++ }
      /does not exist/ { missing++ }
      /violates .*constraint/ { constraint++ }
      /unrecognized configuration parameter/ { config++ }
      END {
        printf "Erros: %d; permissão: %d; extensão: %d; objeto existente: %d; objeto ausente: %d; constraint: %d; configuração: %d\n", errors, permission, extension, existing, missing, constraint, config
      }
    ' "$RESTORE_LOG" | tail -n 40 | tee -a "$REPORT"
    exit 1
  }
ELAPSED=$(( $(date +%s) - START_TS ))
log "✔ restore concluído em ${ELAPSED}s"

# ── Fase 3: smoke queries ────────────────────────────────────────────────
log "## Fase 3 — smoke queries"
pgc psql "$DRILL_DB_URL" -Atqc "SELECT COUNT(*) FROM auth.users" >/dev/null || {
  log "✖ auth.users indisponível"; exit 1; }
pgc psql "$DRILL_DB_URL" -Atqc "SELECT 1 FROM public.user_roles LIMIT 1" >/dev/null || {
  log "✖ public.user_roles indisponível"; exit 1; }
log "✔ smoke queries OK"

# ── Fase 4: row-count parity ─────────────────────────────────────────────
log "## Fase 4 — parity"
drift=0
for t in "${TBLS[@]}"; do
  p="${COUNTS[$t]}"
  d=$(pgc psql "$DRILL_DB_URL" -Atqc "SELECT COUNT(*) FROM public.$t" 2>/dev/null || echo "-1")
  if [[ "$p" == "-1" || "$d" == "-1" ]]; then
    log "✖ $t: falha ao contar (snapshot=$p drill=$d)"; drift=$((drift+1)); continue
  fi
  if [[ "$p" -eq 0 ]]; then
    if [[ "$d" -eq 0 ]]; then log "· $t: ambos zero"; else log "✖ $t: snapshot=0 drill=$d"; drift=$((drift+1)); fi
    continue
  fi
  pct=$(awk -v a="$p" -v b="$d" 'BEGIN{ printf "%.4f", ((a>b?a-b:b-a)/a)*100 }')
  if [[ "$p" == "$d" ]]; then
    cmp=OK
  else
    cmp=$(awk -v a="$p" -v b="$d" -v y="$DRIFT_MAX_PCT" 'BEGIN{ x=((a>b?a-b:b-a)/a)*100; print (y==0 || x>y)?"BAD":"OK" }')
  fi
  log "$([[ $cmp == OK ]] && echo ✔ || echo ✖) $t: snapshot=$p drill=$d drift=${pct}%"
  if [[ "$cmp" == "BAD" ]]; then drift=$((drift+1)); fi
done

# ── Fase 5: teardown (deixa para o operador; instância efêmera) ─────────
log "## Fase 5 — teardown"
log "ℹ O workflow destrói a instância efêmera após esta validação."

if (( drift > 0 )); then
  log "🚨 $drift tabela(s) com drift > ${DRIFT_MAX_PCT}% — DRILL FALHOU"
  exit 1
fi
log "✔ Restore e paridade das tabelas críticas validados — relatório em $REPORT"