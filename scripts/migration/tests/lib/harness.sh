# shellcheck shell=bash
# harness.sh — mini-framework dos testes do kit de migração (sourced).
# Asserções, binários falsos via PATH e bancos/clusters Postgres descartáveis.
# Nada aqui fala com rede externa: só 127.0.0.1.
set -uo pipefail

T_NAME="$(basename "$0")"
MIG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"   # scripts/migration
REPO="$(cd "$MIG/../.." && pwd)"; export REPO
T_LIB="$MIG/tests/lib"
T_TMP="$(mktemp -d)"
T_PASS=0; T_FAIL=0; OUT=""; RC=0
T_DBS=(); T_EPH=(); T_PIDS=()
export FAKE_LOG="$T_TMP/fake.log"; : > "$FAKE_LOG"
export NO_COLOR=1
unset CONFIRM DRY_RUN SRC_DB_URL DEST_DB_URL SOURCE_DB_URL TARGET_DB_URL DEST_REF NEW_REF OLD_REF 2>/dev/null || true

section() { echo "· $*"; }
ok()   { T_PASS=$((T_PASS+1)); if [[ -n "${T_VERBOSE:-}" ]]; then echo "    ok   $*"; fi; return 0; }
fail() {
  T_FAIL=$((T_FAIL+1)); echo "    FALHOU: $*" >&2
  if [[ -n "$OUT" ]]; then printf '%s\n' "$OUT" | tail -n 12 | sed 's/^/        | /' >&2; fi
  return 0
}
# run <cmd...> — executa sem terminal; preenche OUT (stdout+stderr) e RC.
run() { OUT="$("$@" 2>&1 </dev/null)"; RC=$?; return 0; }
is()     { if [[ "$1" == "$2" ]]; then ok "$3"; else fail "$3 (esperado '$2', veio '$1')"; fi; }
rc_is()  { is "$RC" "$1" "$2 [exit]"; }
has()    { if [[ "$OUT" == *"$1"* ]]; then ok "$2"; else fail "$2 (saída sem '$1')"; fi; }
hasnt()  { if [[ "$OUT" != *"$1"* ]]; then ok "$2"; else fail "$2 (saída contém '$1')"; fi; }
truthy() { if "${@:2}" >/dev/null 2>&1; then ok "$1"; else fail "$1"; fi; }
falsy()  { if "${@:2}" >/dev/null 2>&1; then fail "$1"; else ok "$1"; fi; }
skip_all() { echo "SKIP $T_NAME: $*"; exit 0; }

t_cleanup() {
  local p d db
  for p in "${T_PIDS[@]:-}"; do [[ -n "$p" ]] && kill "$p" 2>/dev/null; done
  for db in "${T_DBS[@]:-}"; do
    [[ -n "$db" ]] && psql -h "$PGA_HOST" -p "$PGA_PORT" -U "$PGA_USER" -d postgres -qXc "DROP DATABASE IF EXISTS \"$db\" WITH (FORCE)" >/dev/null 2>&1
  done
  for d in "${T_EPH[@]:-}"; do
    [[ -n "$d" ]] || continue
    as_pg "'$PG_BIN/pg_ctl' -D '$d/data' -m immediate stop" >/dev/null 2>&1
    rm -rf "$d"
  done
  rm -rf "$T_TMP"
}
finish() {
  t_cleanup
  echo "$T_NAME: $T_PASS ok, $T_FAIL falha(s)"
  if (( T_FAIL > 0 )); then exit 1; fi
  exit 0
}
trap 't_cleanup; exit 130' INT TERM

# ── binários falsos ──────────────────────────────────────────────────────────
# fake_bin <nome> [comportamento bash] — cria $T_FAKE/<nome>, que registra o argv
# em $FAKE_LOG (uma linha por chamada, %q) e executa o trecho informado.
T_FAKE="$T_TMP/fake"; mkdir -p "$T_FAKE"
fake_bin() {
  cat > "$T_FAKE/$1" <<'EOF'
#!/usr/bin/env bash
name=$(basename "$0")
{ printf '%s' "$name"; printf ' %q' "$@"; printf '\n'; } >> "${FAKE_LOG:-/dev/null}"
if [[ -f "$0.behavior" ]]; then source "$0.behavior"; fi
EOF
  chmod +x "$T_FAKE/$1"
  printf '%s\n' "${2:-exit 0}" > "$T_FAKE/$1.behavior"
}
with_fakes() { PATH="$T_FAKE:$PATH" "$@"; }
fake_calls() { grep -c "^$1 " "$FAKE_LOG" || true; }

# ── Postgres principal (PGHOST/PGPORT/PGUSER) ───────────────────────────────
PGA_HOST="${PGHOST:-127.0.0.1}"; PGA_USER="${PGUSER:-postgres}"; PGA_PORT="${PGPORT:-}"
pg_main_ok() {
  command -v psql >/dev/null 2>&1 || return 1
  local p
  for p in ${PGA_PORT:-5432 55432}; do
    if psql -h "$PGA_HOST" -p "$p" -U "$PGA_USER" -d postgres -XAtqc "SELECT 1" >/dev/null 2>&1; then PGA_PORT="$p"; return 0; fi
  done
  return 1
}
pga_url() { printf 'postgresql://%s@%s:%s/%s' "$PGA_USER" "$PGA_HOST" "$PGA_PORT" "$1"; }
pga() { psql -h "$PGA_HOST" -p "$PGA_PORT" -U "$PGA_USER" -XAtq -v ON_ERROR_STOP=1 "$@"; }
# pg_mkdb <sufixo> [arquivo.sql...] — cria g6t_<sufixo>_<pid> e imprime o nome.
pg_mkdb() {
  local db="g6t_${1}_$$" f; shift
  pga -d postgres -c "DROP DATABASE IF EXISTS \"$db\"" -c "CREATE DATABASE \"$db\" TEMPLATE template0" >/dev/null 2>&1 || return 1
  T_DBS+=("$db")
  for f in "$@"; do pga -d "$db" -f "$f" >/dev/null 2>&1 || { echo "fixture $f falhou em $db" >&2; return 1; }; done
  printf '%s' "$db"
}

# ── cluster efêmero (wal_level=logical, archive on, papéis Supabase) ─────────
PG_BIN=""
as_pg() { if [[ "$(id -u)" == "0" ]]; then su postgres -s /bin/bash -c "$1"; else bash -c "$1"; fi; }
pg_eph_ok() {
  local d
  if command -v pg_config >/dev/null 2>&1; then PG_BIN="$(pg_config --bindir)"; fi
  if [[ ! -x "$PG_BIN/initdb" ]]; then
    for d in /usr/lib/postgresql/*/bin /usr/local/pgsql/bin /opt/homebrew/opt/postgresql*/bin; do
      if [[ -x "$d/initdb" ]]; then PG_BIN="$d"; fi
    done
  fi
  [[ -x "$PG_BIN/initdb" && -x "$PG_BIN/pg_ctl" ]] || return 1
  if [[ "$(id -u)" == "0" ]]; then id postgres >/dev/null 2>&1 || return 1; fi
  return 0
}
# pg_eph_start — sobe um cluster em porta livre 554xx; define EPH_PORT e EPH_DIR.
pg_eph_start() {
  local dir p
  dir="$(mktemp -d /tmp/g6-eph-XXXXXX)"; chmod 755 "$dir"
  if [[ "$(id -u)" == "0" ]]; then chown postgres "$dir"; fi
  EPH_PORT=""
  for p in $(seq 55400 55499); do
    if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then EPH_PORT="$p"; break; fi
  done
  [[ -n "$EPH_PORT" ]] || return 1
  as_pg "'$PG_BIN/initdb' -D '$dir/data' -U postgres -A trust >/dev/null 2>&1 && mkdir '$dir/arch' '$dir/sock'" || return 1
  as_pg "cat >> '$dir/data/postgresql.conf'" <<EOF
port = $EPH_PORT
listen_addresses = '127.0.0.1'
unix_socket_directories = '$dir/sock'
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
archive_mode = on
archive_command = 'cp %p $dir/arch/%f'
fsync = off
EOF
  # usuário com senha "difícil" para provar que a senha da URL chega certa sem ir ao argv
  as_pg "sed -i '1i host all g6_pw 127.0.0.1/32 scram-sha-256' '$dir/data/pg_hba.conf'"
  as_pg "'$PG_BIN/pg_ctl' -D '$dir/data' -l '$dir/log' -w start >/dev/null 2>&1" || return 1
  T_EPH+=("$dir"); export EPH_DIR="$dir"
  psql -h 127.0.0.1 -p "$EPH_PORT" -U postgres -d postgres -Xq -v ON_ERROR_STOP=1 >/dev/null <<'SQL' || return 1
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator LOGIN NOINHERIT; GRANT anon, authenticated, service_role TO authenticator;
CREATE ROLE g6_pw LOGIN SUPERUSER PASSWORD 'p@ss w0rd$%';
SQL
}
eph_url() { printf 'postgresql://postgres@127.0.0.1:%s/%s' "$EPH_PORT" "$1"; }
eph() { psql -h 127.0.0.1 -p "$EPH_PORT" -U postgres -XAtq -v ON_ERROR_STOP=1 "$@"; }
eph_mkdb() {
  local db="$1" f; shift
  eph -d postgres -c "DROP DATABASE IF EXISTS \"$db\"" -c "CREATE DATABASE \"$db\" TEMPLATE template0" >/dev/null 2>&1 || return 1
  for f in "$@"; do eph -d "$db" -f "$f" >/dev/null 2>&1 || { echo "fixture $f falhou em $db" >&2; return 1; }; done
}

# sig <segundos> <SINAL> <cmd...> — roda em 1º plano e envia o sinal (ver sigrun.py)
sig() { python3 "$T_LIB/sigrun.py" "$@"; }

# lista dos scripts do grupo (shell + mjs), relativos a $MIG
g6_scripts() {
  (cd "$MIG" && find . -name '*.sh' -not -path './verify/*' -not -path './tests/*' -not -path './ddl/tests/*' | sed 's|^\./||' | LC_ALL=C sort)
}
