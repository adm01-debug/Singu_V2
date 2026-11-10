#!/usr/bin/env bash
# check-runbook-coverage.test.sh — prova os dois lados do check-runbook-coverage.sh em
# árvores de mentira (RUNBOOK_COVERAGE_ROOT) e confere o repositório real.
# Não precisa de banco nem de rede. Roda sozinho: bash check-runbook-coverage.test.sh
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALVO="$AQUI/check-runbook-coverage.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PASSOU=0; FALHOU=0

# caso <nome> <código esperado> <regex que TEM de aparecer | ""> [regex que NÃO pode aparecer]
caso() {
  local nome="$1" esperado="$2" tem="${3:-}" nao_tem="${4:-}" rc ok=1
  RUNBOOK_COVERAGE_ROOT="$R" bash "$ALVO" "${ARGS[@]}" >"$TMP/saida.log" 2>&1; rc=$?
  [[ $rc -eq $esperado ]] || ok=0
  [[ -z "$tem" ]] || grep -Eq -- "$tem" "$TMP/saida.log" || ok=0
  [[ -z "$nao_tem" ]] || ! grep -Eq -- "$nao_tem" "$TMP/saida.log" || ok=0
  if [[ $ok -eq 1 ]]; then PASSOU=$((PASSOU + 1)); echo "ok    $nome"
  else FALHOU=$((FALHOU + 1)); echo "FALHA $nome (rc=$rc, esperado $esperado)"; sed 's/^/        /' "$TMP/saida.log"; fi
}

# monta <dir> — árvore mínima válida: 1 regra com runbook_url, 1 alerta em scripts/monitoring
# com "runbook:", 1 guard FATAL, runbook com as três seções.
monta() {
  R="$1"; ARGS=()
  mkdir -p "$R/monitoring/prometheus/rules" "$R/docs/runbooks" "$R/scripts/monitoring" "$R/scripts/migration/verify"
  cat >"$R/monitoring/prometheus/rules/a.yml" <<'YML'
groups:
  - name: g
    rules:
      - alert: ComUrl
        expr: up == 0
        annotations:
          runbook_url: "https://exemplo.test/blob/main/docs/runbooks/db-guards.md#dead-man-switch"
      - alert: Templado
        expr: guard_status == 2
        annotations:
          runbook_url: "https://exemplo.test/docs/runbooks/db-guards.md#{{ $labels.name }}"
      - record: agregado:x
        expr: sum(up)
YML
  cat >"$R/scripts/monitoring/b.yml" <<'YML'
groups:
  - name: h
    rules:
      - alert: ComRunbookRelativo
        expr: up == 0
        annotations:
          runbook: 'docs/runbooks/db-guards.md#secao-b'
YML
  printf '# Runbook\n\n## dead-man-switch\ntexto\n\n## secao-b\ntexto\n\n## meu-guard\ntexto\n' >"$R/docs/runbooks/db-guards.md"
  printf 'FATAL=(\n  meu-guard.sql\n)\nWARN=(\n  outro.sql\n)\n' >"$R/scripts/migration/verify/full-audit.sh"
}

monta "$TMP/ok";          caso "árvore válida passa" 0 '^OK: cobertura completa$' 'MISSING|AVISO'

monta "$TMP/ancora";      sed -i 's/#dead-man-switch/#secao-inexistente/' "$R/monitoring/prometheus/rules/a.yml"
caso "âncora de runbook_url inexistente reprova" 1 "MISSING ancora '## secao-inexistente'.*ComUrl"

monta "$TMP/relativo";    sed -i 's/#secao-b/#sumiu/' "$R/scripts/monitoring/b.yml"
caso "âncora de 'runbook:' em scripts/monitoring reprova (antes nem era lida)" 1 "MISSING ancora '## sumiu'.*ComRunbookRelativo"

monta "$TMP/fatal";       printf 'FATAL=(\n  meu-guard.sql\n  guard-sem-secao.sql\n)\n' >"$R/scripts/migration/verify/full-audit.sh"
caso "guard FATAL sem seção reprova" 1 'MISSING secao runbook para guard FATAL: guard-sem-secao$' 'meu-guard$'

monta "$TMP/semrunbook";  printf '      - alert: SemNada\n        expr: up == 0\n' >>"$R/scripts/monitoring/b.yml"
caso "alerta sem runbook: avisa e passa" 0 'AVISO alerta sem runbook: SemNada \(scripts/monitoring/b.yml\)' 'MISSING'
ARGS=(--strict)
caso "alerta sem runbook com --strict reprova" 1 'MISSING 1 alerta\(s\) sem runbook'
ARGS=()

monta "$TMP/aspas";       cat >>"$R/scripts/monitoring/b.yml" <<'YML'
      - alert: SemAspas
        expr: up == 0
        annotations:
          runbook_url: https://exemplo.test/docs/runbooks/db-guards.md#nao-existe
YML
caso "runbook_url sem aspas também é verificado (antes era ignorado)" 1 "MISSING ancora '## nao-existe'.*SemAspas"

monta "$TMP/outrodoc";    printf '## passo-um\n' >"$R/docs/runbooks/outro.md"
sed -i 's|db-guards.md#secao-b|outro.md#passo-um|' "$R/scripts/monitoring/b.yml"
caso "âncora em outro runbook de docs/runbooks é resolvida no arquivo certo" 0 '^OK'
sed -i 's|outro.md#passo-um|outro.md#passo-dois|' "$R/scripts/monitoring/b.yml"
caso "…e reprova se a seção não existe nele" 1 "MISSING ancora '## passo-dois' em runbook docs/runbooks/outro.md"

monta "$TMP/titulo";      printf '## Dead Man Switch\n## secao-b\n## meu-guard\n' >"$R/docs/runbooks/db-guards.md"
caso "título em formato livre casa pela âncora estilo GitHub" 0 '^OK'

monta "$TMP/semregras";   rm -rf "$R/monitoring/prometheus/rules"
caso "sem diretório de regras: erro de estrutura (2)" 2 'rules dir ausente'
monta "$TMP/semdoc";      rm "$R/docs/runbooks/db-guards.md"
caso "sem runbook: erro de estrutura (2)" 2 'runbook ausente'
monta "$TMP/arg";         ARGS=(--nao-existe)
caso "argumento desconhecido: 2" 2 'argumento desconhecido'
monta "$TMP/espaco dir/á"; caso "raiz com espaço e acento no caminho" 0 '^OK'

# Repositório real: o contrato do CI (bash scripts/monitoring/check-runbook-coverage.sh) passa.
unset RUNBOOK_COVERAGE_ROOT
if bash "$ALVO" >"$TMP/real.log" 2>&1; then PASSOU=$((PASSOU + 1)); echo "ok    repositório real: $(tail -n 1 "$TMP/real.log")"
else FALHOU=$((FALHOU + 1)); echo "FALHA repositório real"; cat "$TMP/real.log"; fi

echo "check-runbook-coverage.test: $PASSOU ok, $FALHOU falha(s)"
[[ $FALHOU -eq 0 ]]
