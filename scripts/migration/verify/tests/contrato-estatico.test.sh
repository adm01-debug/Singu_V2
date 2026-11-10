#!/usr/bin/env bash
# contrato-estatico.test.sh — checagens que não precisam de banco. Roda sozinho
# (bash contrato-estatico.test.sh) e também como cenário 00 do run-all.sh.
#  1. Todo *.sql de verify/ declara "-- Classe   :" no cabeçalho.
#  2. Arquivo de classe GUARD tem RAISE EXCEPTION (guard que nunca falha não é guard).
#  3. Toda variável psql usada (:var, :'var') tem default via \if :{?var} — ou vem de \gset.
#  4. Arquivos consumidos com "psql -c" (SQL puro) não têm meta-comandos.
#  5. Listas do full-audit.sh cobrem todos os *.sql (full-audit.sh --verificar-lista).
#  6. Todo guard (classe GUARD, *-guard.sql, lista FATAL e arquivos chamados pelo CI) tem
#     cenário provando os DOIS lados.
#  7. Todo *.sql é exercitado pela fumaça (que varre o diretório inteiro).
#  8. Todo *.sh de verify/ e de monitoring/ passa em `bash -n`.
# Saída: 0 = tudo certo; 1 = alguma violação (uma linha por violação).
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY="$(cd "$AQUI/.." && pwd)"
RAIZ="$(cd "$AQUI/../../../.." && pwd)"
CEN="$AQUI/scenarios"
falhas=0
ruim() { echo "✖ $*"; falhas=$((falhas + 1)); }

shopt -s nullglob
for f in "$VERIFY"/*.sql; do
  b="$(basename "$f")"
  cab="$(awk '/^--/{print; next} {exit}' "$f")"
  grep -q '^-- Classe   : ' <<<"$cab" || { ruim "$b: cabeçalho sem '-- Classe   :'"; continue; }
  classe="$(grep -m1 '^-- Classe   : ' <<<"$cab")"
  if [[ "$classe" == *GUARD* ]]; then
    grep -q 'RAISE EXCEPTION' "$f" || ruim "$b: classe GUARD sem RAISE EXCEPTION"
    grep -q '^-- Saida    : ' <<<"$cab" || ruim "$b: classe GUARD sem linha '-- Saida    :'"
    grep -q '^\\set ON_ERROR_STOP on' "$f" || ruim "$b: classe GUARD sem \\set ON_ERROR_STOP on"
  fi
  # variáveis psql: :nome ou :'nome' fora de comentário; ignora casts (::tipo) e horários
  sem_coment="$(sed 's/--.*$//' "$f")"
  while IFS= read -r v; do
    [[ -n "$v" ]] || continue
    grep -qE "^\\\\if :\{\?$v\}" "$f" && continue
    grep -qE "\\\\gset" "$f" && grep -qE "AS $v([ ,]|$)" "$f" && continue
    ruim "$b: variável psql :$v sem default (\\if :{?$v})"
  done < <(grep -oE "(^|[^:[:alnum:]_]):'?[a-z_][a-z0-9_]*" <<<"$sem_coment" | grep -oE "[a-z_][a-z0-9_]*$" | sort -u)
done

for b in extensions-versions.sql tz-locale-parity.sql; do
  grep -q '^[\]' "$VERIFY/$b" && ruim "$b: consumido via psql -c, não pode ter meta-comando"
done

bash "$VERIFY/full-audit.sh" --verificar-lista >/dev/null 2>&1 || ruim "full-audit.sh --verificar-lista acusou divergência"

# Guards que precisam dos dois lados.
mapfile -t GUARDS < <(
  { grep -l '^-- Classe   : GUARD' "$VERIFY"/*.sql | xargs -n1 basename
    find "$VERIFY" -maxdepth 1 -name '*-guard.sql' -printf '%f\n'
    bash "$VERIFY/full-audit.sh" --listar | awk '$1=="FATAL"{print $2}'
    grep -ohE 'scripts/migration/verify/[a-z0-9-]+\.sql' "$RAIZ"/.github/workflows/*.yml 2>/dev/null | xargs -n1 basename
  } | sort -u)
for g in "${GUARDS[@]}"; do
  # "usa" = invoca o arquivo (helper guard ou psql -f), não apenas cita o nome
  mapfile -t usos < <(grep -lE -- "(guard +|-f +\"\\\$(SCRIPT_DIR/\.\.|VERIFY_DIR)/)${g//./\\.}" "$CEN"/*.sh 2>/dev/null)
  ruim_ok=0; bom_ok=0
  for c in "${usos[@]}"; do
    grep -qE '^EXPECTED_EXIT=nonzero|espera_saida (nonzero|[1-9])' "$c" && ruim_ok=1
    grep -qE '^DOIS_LADOS=1|^EXPECTED_EXIT=0|espera_saida 0' "$c" && bom_ok=1
  done
  [[ $ruim_ok -eq 1 ]] || ruim "$g: nenhum cenário prova o lado RUIM (saída != 0)"
  [[ $bom_ok -eq 1 ]]  || ruim "$g: nenhum cenário prova o lado LIMPO (saída 0)"
done

grep -q 'fumaca_sql' "$CEN"/70-*.sh "$CEN"/71-*.sh 2>/dev/null || ruim "fumaça (70/71) ausente: *.sql sem execução garantida"

for f in "$VERIFY"/*.sh "$VERIFY"/exporter/*.sh "$AQUI"/*.sh "$CEN"/*.sh "$RAIZ"/scripts/monitoring/*.sh; do
  bash -n "$f" 2>/dev/null || ruim "$(basename "$f"): erro de sintaxe (bash -n)"
done

n_sql=$(find "$VERIFY" -maxdepth 1 -name '*.sql' | wc -l)
n_cen=$(find "$CEN" -maxdepth 1 -name '*.sh' | wc -l)
echo "contrato estático: $n_sql arquivos .sql, ${#GUARDS[@]} guards com dois lados exigidos, $n_cen cenários, $falhas violação(ões)"
[[ $falhas -eq 0 ]]
