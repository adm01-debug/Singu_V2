#!/usr/bin/env bash
# ============================================================================
# rollback.sh — orquestrador de rollback do cutover.
#
# Uso:
#   ./rollback.sh                                  # dry-run: lista os passos
#   ./rollback.sh --i-know-what-im-doing           # executa os passos automáticos
#   ./rollback.sh --step 5 --i-know-what-im-doing  # só o passo 5 (auth)
#   ./rollback.sh --dry-run ...                    # força dry-run (sempre vence)
#
# Só o passo 5 (remover a flag must_reset_password, via unmark-must-reset.sh
# --all) é automático; os demais são manuais e ficam listados. Idempotente.
# Ambiente: DEST_DB_URL (ou TARGET_DB_URL) — ver unmark-must-reset.sh.
# Exit: 0 ok · 1 passo automático falhou · 2 uso.
# ============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CONFIRM_FLAG=0; DRY_RUN=0
STEP="all"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --i-know-what-im-doing) CONFIRM_FLAG=1; shift;;
    --dry-run) DRY_RUN=1; shift;;
    --step)
      [[ $# -ge 2 ]] || { echo "--step exige um valor (5|auth|all)" >&2; exit 2; }
      STEP="$2"; shift 2;;
    -h|--help) sed -n '2,/^[^#]/{/^#/!d;s/^# \{0,1\}//;p}' "${BASH_SOURCE[0]}"; exit 0;;
    *) echo "Flag desconhecida: $1" >&2; exit 2;;
  esac
done
case "$STEP" in
  5|auth|all) ;;
  *) echo "Step desconhecido: $STEP (válidos: 5, auth, all)" >&2; exit 2 ;;
esac

echo "═══════════════════════════════════════════════════════════"
echo "  ROLLBACK DA MIGRAÇÃO — apontará o app de volta à ORIGEM"
echo "  Ordem reversa: DNS/env → Cron → Functions → Storage → DB"
echo "═══════════════════════════════════════════════════════════"

if [[ $CONFIRM_FLAG -ne 1 || $DRY_RUN -eq 1 ]]; then
  cat <<TXT

MODO DRY-RUN (sem --i-know-what-im-doing). Steps que seriam executados:

  1. [manual]   Reverter DNS/VITE_SUPABASE_URL para o projeto ORIGEM
  2. [manual]   Reativar cron jobs no ORIGEM (cutover/freeze-origin.sh --unfreeze)
  3. [manual]   Restaurar tráfego de edge functions no ORIGEM
  4. [auto]     Storage: destino permanece intacto (sem delete); ORIGEM segue autoritativo
  5. [auto]     Auth: remover flag must_reset_password dos usuários no DESTINO
                → ./unmark-must-reset.sh --all
  6. [manual]   Comunicar rollback aos usuários que já resetaram senha no destino
                (esses precisarão logar com senha antiga no ORIGEM)

Use --step <n> para executar um passo específico com --i-know-what-im-doing.
TXT
  exit 0
fi

echo "▶ Passo 5: unmark-must-reset --all"
if ! bash "$SCRIPT_DIR/unmark-must-reset.sh" --all --yes; then
  echo "✖ Passo 5 falhou — rollback automático INCOMPLETO." >&2
  exit 1
fi
echo "✔ Passos automatizados concluídos. Passos 1-4 e 6 são manuais — veja MIGRATION_MASTER_RUNBOOK.md"
