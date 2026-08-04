#!/usr/bin/env bash
# Runner para testes RLS — executa cada arquivo .sql em tests/rls/
# Pré-req: variáveis PG* configuradas (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)

set -e

if [ -z "$PGHOST" ]; then
  echo "::warning::PGHOST não definido — pulando testes RLS"
  exit 0
fi

# Fixtures obrigatórias — UUIDs de usuários criados no ambiente de teste
: "${RLS_USER_A:=00000000-0000-0000-0000-00000000000a}"
: "${RLS_USER_B:=00000000-0000-0000-0000-00000000000b}"
: "${RLS_USER_ADMIN:=00000000-0000-0000-0000-00000000000c}"
export RLS_USER_A RLS_USER_B RLS_USER_ADMIN

PSQL_VARS=(
  -v "ON_ERROR_STOP=1"
  -v "user_a=${RLS_USER_A}"
  -v "user_b=${RLS_USER_B}"
  -v "user_admin=${RLS_USER_ADMIN}"
)

cd "$(dirname "$0")"
FAILED=0

for f in *.sql; do
  [ "$f" = "schema.sql" ] && continue
  echo "▶️  Rodando $f..."
  if psql "${PSQL_VARS[@]}" -f "$f" > /tmp/rls-${f}.out 2>&1; then
    echo "✅ $f OK"
  else
    echo "❌ $f FALHOU"
    cat /tmp/rls-${f}.out
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -gt 0 ]; then
  echo "⚠️  $FAILED arquivo(s) com falhas"
  exit 1
fi

echo "✅ Todos os testes RLS passaram"
