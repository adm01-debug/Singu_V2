#!/usr/bin/env bash
# Executa os testes RLS contra o banco apontado por PG* sem deixar resíduo:
# cada arquivo roda numa transação revertida que antes aplica as migrations
# do repositório mais novas que o ledger remoto (estado "banco + este branch").
# Saída de arquivo com "SKIP:" conta como pulado e é listada no resumo.
# Execuções concorrentes do gate são serializadas por advisory lock; conflito
# de lock com o tráfego do banco (deadlock/lock_timeout) é repetido até 3 vezes.
set -euo pipefail

if [ -z "${PGHOST:-}" ]; then
  echo "::warning::PGHOST não definido — pulando testes RLS"
  exit 0
fi

: "${RLS_USER_A:=00000000-0000-0000-0000-00000000000a}"
: "${RLS_USER_B:=00000000-0000-0000-0000-00000000000b}"
: "${RLS_USER_ADMIN:=00000000-0000-0000-0000-00000000000c}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TESTS="$ROOT/tests/rls"
node --test "$TESTS/prepare-sql.node-test.mjs"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PSQL=(psql -X -q -v ON_ERROR_STOP=1
  -v "user_a=${RLS_USER_A}" -v "user_b=${RLS_USER_B}" -v "user_admin=${RLS_USER_ADMIN}")

MAXV="$("${PSQL[@]}" -At -c "SELECT coalesce(max(version), '0') FROM supabase_migrations.schema_migrations")"
PENDING=()
for m in "$ROOT"/supabase/migrations/*.sql; do
  v="$(basename "$m")"; v="${v%%_*}"
  if [[ "$v" > "$MAXV" ]]; then PENDING+=("$m"); fi
done
echo "ledger remoto: $MAXV — migrations pendentes aplicadas em transação: ${#PENDING[@]}"
NORMALIZED=()
for m in "${PENDING[@]}"; do
  name="$(basename "$m")"
  echo "  • $name"
  node "$TESTS/prepare-sql.mjs" migration "$m" > "$WORK/migration_$name"
  NORMALIZED+=("$WORK/migration_$name")
done

FAILED=(); SKIPPED=(); PASSED=0
for f in "$TESTS"/*.sql; do
  name="$(basename "$f")"
  [ "$name" = "schema.sql" ] && continue
  node "$TESTS/prepare-sql.mjs" fixture "$f" > "$WORK/body_$name"
  {
    echo 'BEGIN;'
    echo "SET LOCAL lock_timeout = '180s';"
    echo "SELECT pg_advisory_xact_lock(hashtext('singu-rls-gate'));"
    echo "SET LOCAL lock_timeout = '5s';"
    echo "SET LOCAL statement_timeout = '60s';"
    for m in "${NORMALIZED[@]}"; do echo "\\i '$m'"; done
    echo "\\i '$WORK/body_$name'"
    echo 'ROLLBACK;'
  } > "$WORK/run_$name"

  ok=0
  for attempt in 1 2 3; do
    if (cd "$TESTS" && "${PSQL[@]}" -f "$WORK/run_$name") > "$WORK/out_$name" 2>&1; then ok=1; break; fi
    grep -qE 'deadlock detected|lock timeout' "$WORK/out_$name" || break
    echo "↻  $name: conflito de lock com tráfego do banco — tentativa $((attempt + 1))"; sleep 5
  done
  if [ "$ok" = 1 ]; then
    if grep -q 'SKIP:' "$WORK/out_$name"; then
      SKIPPED+=("$name: $(grep -o 'SKIP:.*' "$WORK/out_$name" | head -1)")
      echo "⏭️  $name PULADO"
    else
      PASSED=$((PASSED + 1)); echo "✅ $name OK"
    fi
  else
    FAILED+=("$name"); echo "❌ $name FALHOU"; cat "$WORK/out_$name"
  fi
done

echo "Resumo: ${PASSED} OK, ${#SKIPPED[@]} pulado(s), ${#FAILED[@]} falha(s)"
for s in "${SKIPPED[@]}"; do echo "::warning::RLS $s"; done
[ ${#FAILED[@]} -eq 0 ] || { echo "⚠️  Falhas: ${FAILED[*]}"; exit 1; }
