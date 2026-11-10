#!/usr/bin/env bash
# check-runbook-coverage.sh — Rodada 26/10
# Garante que todo alerta aponta para uma seção que EXISTE no runbook.
#
# Falha (saída 1) quando:
#   1. um alerta de monitoring/prometheus/rules/*.yml ou scripts/monitoring/*.yml tem
#      anotação runbook_url:/runbook: cuja âncora (#...) não corresponde a um título
#      "## <âncora>" do arquivo docs/runbooks/<arquivo>.md citado (default db-guards.md);
#   2. um guard da lista FATAL do full-audit.sh não tem seção "## <guard>" em
#      docs/runbooks/db-guards.md (o alerta DBGuardFatal monta a âncora com o nome do guard).
# Avisa, sem falhar, quando um alerta não tem NENHUMA anotação de runbook. Com --strict
# (ou RUNBOOK_STRICT=1) esses avisos também reprovam.
#
# Uso: check-runbook-coverage.sh [--strict]
#   RUNBOOK_COVERAGE_ROOT=<dir>  raiz alternativa do repositório (usado nos testes)
# Códigos de saída: 0 = cobertura completa; 1 = lacuna; 2 = erro de uso ou estrutura ausente.
set -euo pipefail

STRICT="${RUNBOOK_STRICT:-0}"
case "${1:-}" in
  "") ;;
  --strict) STRICT=1 ;;
  -h|--help) sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
  *) echo "argumento desconhecido: $1 (veja --help)" >&2; exit 2 ;;
esac

ROOT="${RUNBOOK_COVERAGE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
RULES_DIR="$ROOT/monitoring/prometheus/rules"
RUNBOOK_DIR="$ROOT/docs/runbooks"
RUNBOOK="$RUNBOOK_DIR/db-guards.md"

[[ -d "$RULES_DIR" ]] || { echo "rules dir ausente"; exit 2; }
[[ -f "$RUNBOOK" ]]   || { echo "runbook ausente"; exit 2; }

# tem_ancora <arquivo.md> <âncora> — título "## x" literal ou no formato de âncora do GitHub
# (minúsculas, espaços viram hífen, pontuação some).
tem_ancora() {
  [[ -f "$1" ]] || return 1
  awk -v alvo="$2" '
    /^##+ / {
      t = $0; sub(/^##+ +/, "", t); sub(/[ \t\r]+$/, "", t)
      if (t == alvo) { achou = 1; exit }
      s = tolower(t); gsub(/[^a-z0-9 _-]/, "", s); gsub(/ /, "-", s)
      if (s == alvo) { achou = 1; exit }
    }
    END { exit !achou }' "$1"
}

# Extrai "arquivo<TAB>alerta<TAB>referência" (referência vazia = alerta sem runbook).
lista_alertas() {
  awk '
    function fecha() { if (alerta != "") printf "%s\t%s\t%s\n", arq, alerta, ref; alerta = ""; ref = "" }
    FNR == 1 { fecha() }
    /^[[:space:]]*-[[:space:]]*alert:[[:space:]]*/ {
      fecha(); alerta = $0; arq = FILENAME
      sub(/^[[:space:]]*-[[:space:]]*alert:[[:space:]]*/, "", alerta); sub(/[[:space:]]+(#.*)?$/, "", alerta)
      gsub(/^["\047]|["\047]$/, "", alerta); next
    }
    /^[[:space:]]*-[[:space:]]*record:/ { fecha(); next }
    alerta != "" && /^[[:space:]]*runbook(_url)?:[[:space:]]*/ {
      ref = $0
      sub(/^[[:space:]]*runbook(_url)?:[[:space:]]*/, "", ref); sub(/[[:space:]]+$/, "", ref)
      gsub(/^["\047]|["\047]$/, "", ref)
    }
    END { fecha() }' "$@"
}

shopt -s nullglob
ARQUIVOS=("$RULES_DIR"/*.yml "$RULES_DIR"/*.yaml "$ROOT"/scripts/monitoring/*.yml "$ROOT"/scripts/monitoring/*.yaml)

FAILED=0
SEM_RUNBOOK=0
TOTAL=0
if [[ ${#ARQUIVOS[@]} -gt 0 ]]; then
  while IFS=$'\t' read -r arquivo alerta ref; do
    TOTAL=$((TOTAL + 1))
    rel="${arquivo#"$ROOT"/}"
    if [[ -z "$ref" ]]; then
      echo "AVISO alerta sem runbook: $alerta ($rel)"
      SEM_RUNBOOK=$((SEM_RUNBOOK + 1))
      continue
    fi
    [[ "$ref" == *"#"* ]] || { echo "AVISO runbook sem ancora (#secao) em $alerta ($rel): $ref"; SEM_RUNBOOK=$((SEM_RUNBOOK + 1)); continue; }
    anchor="${ref##*#}"
    # âncora montada por template ({{ $labels.name }}) é coberta pela checagem da lista FATAL
    [[ "$anchor" == *"{{"* ]] && continue
    doc="$RUNBOOK"
    if [[ "${ref%%#*}" =~ runbooks/([A-Za-z0-9._-]+\.md)$ ]]; then doc="$RUNBOOK_DIR/${BASH_REMATCH[1]}"; fi
    if ! tem_ancora "$doc" "$anchor"; then
      echo "MISSING ancora '## $anchor' em runbook ${doc#"$ROOT"/} (alerta $alerta, $rel)"
      FAILED=$((FAILED+1))
    fi
  done < <(lista_alertas "${ARQUIVOS[@]}")
fi

AUDIT="$ROOT/scripts/migration/verify/full-audit.sh"
if [[ -f "$AUDIT" ]]; then
  in_fatal=0
  while IFS= read -r line; do
    if [[ "$line" == "FATAL=("* ]]; then in_fatal=1; continue; fi
    if [[ $in_fatal -eq 1 && "$line" == ")"* ]]; then in_fatal=0; continue; fi
    if [[ $in_fatal -eq 1 ]]; then
      name="${line%%#*}"; name="${name//[[:space:]]/}"; name="${name%.sql}"
      [[ -z "$name" ]] && continue
      if ! tem_ancora "$RUNBOOK" "$name"; then
        echo "MISSING secao runbook para guard FATAL: $name"
        FAILED=$((FAILED+1))
      fi
    fi
  done <"$AUDIT"
fi

if [[ "$STRICT" == 1 && "$SEM_RUNBOOK" -gt 0 ]]; then
  echo "MISSING $SEM_RUNBOOK alerta(s) sem runbook (--strict)"
  FAILED=$((FAILED + SEM_RUNBOOK))
fi
if [[ "$FAILED" -gt 0 ]]; then echo "FAIL: $FAILED"; exit 1; fi
if [[ "$SEM_RUNBOOK" -gt 0 ]]; then
  echo "OK: cobertura completa ($TOTAL alertas; $SEM_RUNBOOK sem runbook — ver AVISO acima)"
else
  echo "OK: cobertura completa"
fi
