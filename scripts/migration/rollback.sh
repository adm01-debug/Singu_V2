#!/usr/bin/env bash
# Orquestrador de rollback do cutover.
# EXIGE --i-know-what-im-doing para executar destrutivo.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CONFIRM=0
STEP="all"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --i-know-what-im-doing) CONFIRM=1; shift;;
    --step) STEP="$2"; shift 2;;
    *) echo "Flag desconhecida: $1"; exit 2;;
  esac
done

echo "═══════════════════════════════════════════════════════════"
echo "  ROLLBACK DA MIGRAÇÃO — apontará o app de volta à ORIGEM"
echo "  Ordem reversa: DNS/env → Cron → Functions → Storage → DB"
echo "═══════════════════════════════════════════════════════════"

if [[ $CONFIRM -ne 1 ]]; then
  cat <<TXT

MODO DRY-RUN (sem --i-know-what-im-doing). Steps que seriam executados:

  1. [manual]   Reverter DNS/VITE_SUPABASE_URL para o projeto ORIGEM
  2. [manual]   Reativar cron jobs no ORIGEM (SELECT cron.alter_job(id, active:=true))
  3. [manual]   Restaurar tráfego de edge functions no ORIGEM
  4. [auto]     Storage: destino permanece intacto (sem delete); ORIGEM segue autoritativo
  5. [auto]     Auth: remover flag must_reset_password dos usuários no ORIGEM
                → ./unmark-must-reset.sh
  6. [manual]   Comunicar rollback aos usuários que já resetaram senha no destino
                (esses precisarão logar com senha antiga no ORIGEM)

Use --step <n> para executar um passo específico com --i-know-what-im-doing.
TXT
  exit 0
fi

case "$STEP" in
  5|auth) exec "$SCRIPT_DIR/unmark-must-reset.sh" ;;
  all)
    echo "▶ Passo 5: unmark-must-reset"
    "$SCRIPT_DIR/unmark-must-reset.sh"
    echo "✔ Passos automatizados concluídos. Passos 1-4 e 6 são manuais — veja MIGRATION_MASTER_RUNBOOK.md"
    ;;
  *) echo "Step desconhecido: $STEP"; exit 2 ;;
esac
