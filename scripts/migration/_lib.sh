# shellcheck shell=bash
# ============================================================================
# _lib.sh — utilitários comuns do kit de migração (sourced; não executar).
#
# Fornece: log com timestamp, carga segura de .env (sem `source`), conexão
# Postgres com a senha FORA do argv, redação de segredos, confirmação explícita
# para ações reais e checagem de dependências.
#
# Códigos de saída usados pelos scripts do kit:
#   0 ok · 1 falha operacional/divergência · 2 uso, configuração, dependência
#   ausente ou confirmação negada · 130 interrompido (SIGINT/SIGTERM)
# ============================================================================

MIG_TAG="${MIG_TAG:-migration}"

mig_ts()  { date -u +%Y-%m-%dT%H:%M:%SZ; }
mig_log() { printf '[%s %s] %s\n' "$MIG_TAG" "$(mig_ts)" "$*"; }
mig_err() { printf '[%s %s] %s\n' "$MIG_TAG" "$(mig_ts)" "$*" >&2; }
mig_die() { local code="$1"; shift; mig_err "✖ $*"; exit "$code"; }

# mig_need <bin>... — aborta (2) listando TODOS os binários ausentes.
mig_need() {
  local bin missing=()
  for bin in "$@"; do command -v "$bin" >/dev/null 2>&1 || missing+=("$bin"); done
  [[ ${#missing[@]} -eq 0 ]] || mig_die 2 "dependência ausente no PATH: ${missing[*]}"
}

mig_is_uint() { [[ "${1:-}" =~ ^[0-9]+$ ]]; }

# mig_opt_arg <flag> <restantes> — valida que a flag recebeu valor.
mig_opt_arg() { [[ "$2" -ge 2 ]] || mig_die 2 "a opção $1 exige um valor"; }

# mig_load_env <arquivo>... — lê KEY=VALUE sem executar nada do arquivo.
# Aceita `export KEY=...`, aspas simples/duplas e comentário inline (` # ...`).
# Variável já definida no ambiente NUNCA é sobrescrita (ambiente vence), então
# `CONCURRENCY=16 ./run.sh` funciona mesmo com CONCURRENCY=8 no arquivo.
mig_load_env() {
  local f line key val
  for f in "$@"; do
    [[ -f "$f" ]] || continue
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%$'\r'}"
      [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
      key="${BASH_REMATCH[2]}"; val="${BASH_REMATCH[3]}"
      if [[ "$val" =~ ^\"(.*)\"[[:space:]]*(#.*)?$ ]]; then
        val="${BASH_REMATCH[1]}"
      elif [[ "$val" =~ ^\'(.*)\'[[:space:]]*(#.*)?$ ]]; then
        val="${BASH_REMATCH[1]}"
      else
        val="${val%%[[:space:]]#*}"
        val="${val%"${val##*[![:space:]]}"}"
      fi
      [[ -n "${!key+x}" ]] && continue
      export "$key=$val"
    done < "$f"
  done
}

# mig_alias <CANÔNICA> <LEGADA> — aceita o nome legado; conflito aborta (2).
mig_alias() {
  local canon="$1" legacy="$2"
  if [[ -n "${!legacy:-}" ]]; then
    if [[ -n "${!canon:-}" && "${!canon}" != "${!legacy}" ]]; then
      mig_die 2 "$canon e $legacy estão definidas com valores diferentes — deixe só uma"
    fi
    export "$canon=${!legacy}"
  fi
}

mig_urldecode() {
  local s="${1//\\/\\\\}"
  printf '%b' "${s//%/\\x}"
}

# mig_pg_split <url> — separa a senha da URL: preenche MIG_PG_URL (sem senha) e
# MIG_PG_PASSWORD (decodificada; vazia se a URL não traz senha).
mig_pg_split() {
  MIG_PG_URL="$1"; MIG_PG_PASSWORD=""
  if [[ "$1" =~ ^(postgres(ql)?://)([^:@/]*):([^@/]*)@(.*)$ ]]; then
    MIG_PG_URL="${BASH_REMATCH[1]}${BASH_REMATCH[3]}@${BASH_REMATCH[5]}"
    MIG_PG_PASSWORD="$(mig_urldecode "${BASH_REMATCH[4]}")"
  fi
}

# mig_pg <bin> <url> [args...] — roda psql/pg_dump/pg_restore/pg_recvlogical com
# `-d <url sem senha>` e a senha em PGPASSWORD (ambiente do filho): a senha não
# aparece em `ps`. URL sem senha embutida passa intacta (usa PGPASSWORD/.pgpass).
mig_pg() {
  local bin="$1" MIG_PG_URL MIG_PG_PASSWORD
  mig_pg_split "$2"; shift 2
  if [[ -n "$MIG_PG_PASSWORD" ]]; then
    PGPASSWORD="$MIG_PG_PASSWORD" "$bin" -d "$MIG_PG_URL" "$@"
  else
    "$bin" -d "$MIG_PG_URL" "$@"
  fi
}
mig_psql() { mig_pg psql "$@"; }

# mig_target <url> — "host:porta/banco" sem credenciais nem query string.
mig_target() {
  local u="${1#*://}"
  u="${u##*@}"; u="${u%%\?*}"
  printf '%s' "$u"
}

# mig_redact — filtro (stdin→stdout) que mascara URLs com senha, JWTs e tokens.
mig_redact() {
  sed -E \
    -e 's#(postgres(ql)?://[^:/@[:space:]]*):[^@[:space:]]+@#\1:***@#g' \
    -e 's#eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}#<jwt>#g' \
    -e 's#sbp_[A-Za-z0-9]{16,}#sbp_***#g' \
    -e 's#sb_secret_[A-Za-z0-9_-]{8,}#sb_secret_***#g' \
    -e 's#([Bb]earer )[A-Za-z0-9._-]{8,}#\1***#g'
}

# mig_confirm <descrição> <token> — exige confirmação para a ação real.
# Passa com MIG_YES=1 (flag --yes) ou CONFIRM=<token>; em terminal interativo
# pergunta; sem terminal e sem confirmação aborta (2) sem fazer nada.
mig_confirm() {
  local what="$1" token="$2" ans=""
  [[ "${MIG_YES:-0}" == "1" || "${CONFIRM:-}" == "$token" ]] && return 0
  [[ -z "${CONFIRM:-}" ]] || mig_die 2 "CONFIRM não confere com o alvo ($token) — nada foi feito"
  if [[ -t 0 ]]; then
    printf '%s\nDigite %s para confirmar: ' "$what" "$token" >&2
    read -r ans || true
    [[ "$ans" == "$token" ]] && return 0
    mig_die 2 "confirmação não confere — nada foi feito"
  fi
  mig_die 2 "ação real exige confirmação: --yes, CONFIRM=$token ou terminal interativo (simule com --dry-run)"
}

# mig_help <arquivo> — imprime o cabeçalho de comentários do script.
mig_help() { sed -n '2,/^[^#]/{/^#/!d;s/^# \{0,1\}//;p}' "$1"; }
