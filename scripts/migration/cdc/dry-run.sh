#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CDC dry-run em STAGING
#
# Valida, sem cutover, que o pipeline CDC (drain → replay → checkpoint) está
# íntegro antes da janela de migração. Escreve em STAGING: cria slot na origem,
# tabela de checkpoint no destino e (opcional) uma tabela canário nos dois.
#
# Fases:
#   0. Preflight: envs, binários, wal_level, slots livres
#   1. Bootstrap: cria slot idempotente + checkpoint table no destino
#   2. Drain time-boxed: pg_recvlogical em background por CDC_DRY_RUN_SEC
#   3. Carga sintética (opcional): gera writes controlados na origem
#   4. Replay: aplica WAL no destino (2x — a 2ª tem de aplicar 0)
#   5. Métricas + gates: WAL capturado, checkpoint, idempotência, canário
#   6. Cleanup (sempre, mesmo em falha/Ctrl+C): para o drain, dropa o slot que
#      ESTE run criou e remove as tabelas canário
#
# Uso:
#   CDC_DRY_RUN_SEC=60 SYNTHETIC_WRITES=1 ./dry-run.sh
#   KEEP_SLOT=1 ./dry-run.sh          # não dropa o slot ao final
#   SKIP_CLEANUP=1 ./dry-run.sh       # mantém slot e canário para inspeção
# Ambiente (scripts/migration/.env; ambiente vence): SRC_DB_URL, DEST_DB_URL,
#   DEST_SUPABASE_URL, DEST_SERVICE_ROLE_KEY (obrigatórias); CDC_SLOT (padrão
#   migration_slot_dryrun), CDC_PLUGIN (padrão wal2json), CDC_OUT_DIR,
#   CDC_DRY_RUN_SEC (padrão 30), REPORT_FILE.
# Exit: 0 todos os gates ok · 1 falha ou gate reprovado · 2 uso/config.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source-path=SCRIPTDIR source=../_lib.sh
source "$ROOT_DIR/_lib.sh"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

mig_load_env "$ROOT_DIR/.env" "$ROOT_DIR/env.migration"
mig_alias SRC_DB_URL SOURCE_DB_URL
mig_alias DEST_DB_URL TARGET_DB_URL
for v in SRC_DB_URL DEST_DB_URL DEST_SUPABASE_URL DEST_SERVICE_ROLE_KEY; do
  [[ -n "${!v:-}" ]] || mig_die 2 "defina $v (staging)"
done

CDC_SLOT="${CDC_SLOT:-migration_slot_dryrun}"
CDC_PLUGIN="${CDC_PLUGIN:-wal2json}"
CDC_OUT_DIR="${CDC_OUT_DIR:-$SCRIPT_DIR/out-dryrun}"
CDC_DRY_RUN_SEC="${CDC_DRY_RUN_SEC:-30}"
SYNTHETIC_WRITES="${SYNTHETIC_WRITES:-0}"
KEEP_SLOT="${KEEP_SLOT:-0}"
SKIP_CLEANUP="${SKIP_CLEANUP:-0}"
REPORT_FILE="${REPORT_FILE:-$SCRIPT_DIR/dry-run-report-$(date -u +%Y%m%dT%H%M%SZ).md}"
[[ "$CDC_SLOT" =~ ^[a-z0-9_]{1,63}$ ]]   || mig_die 2 "CDC_SLOT inválido: use só a-z, 0-9 e _"
[[ "$CDC_PLUGIN" =~ ^[a-z0-9_]{1,63}$ ]] || mig_die 2 "CDC_PLUGIN inválido"
mig_is_uint "$CDC_DRY_RUN_SEC" || mig_die 2 "CDC_DRY_RUN_SEC inválido: $CDC_DRY_RUN_SEC"

umask 077   # WAL e logs de replay contêm dados
mkdir -p "$CDC_OUT_DIR"

log() { printf '\n[%s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }
fail() { printf '\n❌ %s\n' "$*" >&2; exit 1; }
src() { mig_psql "$SRC_DB_URL"  -X -v ON_ERROR_STOP=1 "$@"; }
dst() { mig_psql "$DEST_DB_URL" -X -v ON_ERROR_STOP=1 "$@"; }

DRAIN_PID=""; SLOT_CREATED=0; CANARY=0
cleanup() {
  local rc=$?
  trap - EXIT INT TERM
  if [[ -n "$DRAIN_PID" ]]; then kill -INT "$DRAIN_PID" 2>/dev/null || true; wait "$DRAIN_PID" 2>/dev/null || true; fi
  if [[ "$SKIP_CLEANUP" != "1" ]]; then
    if [[ "$SLOT_CREATED" == "1" && "$KEEP_SLOT" != "1" ]]; then
      # slot esquecido retém WAL na origem para sempre — sempre tenta remover
      if src -qc "SELECT pg_drop_replication_slot('$CDC_SLOT')" >/dev/null 2>&1; then
        log "✔ Slot $CDC_SLOT dropado"
      else
        log "⚠ NÃO consegui dropar o slot $CDC_SLOT — remova à mão: SELECT pg_drop_replication_slot('$CDC_SLOT')"
        [[ $rc -ne 0 ]] || rc=1
      fi
    fi
    if [[ "$CANARY" == "1" ]]; then
      src -qc "DROP TABLE IF EXISTS public._cdc_dryrun_canary" >/dev/null 2>&1 || true
      dst -qc "DROP TABLE IF EXISTS public._cdc_dryrun_canary" >/dev/null 2>&1 || true
      log "✔ Canary tables removidas"
    fi
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

# ─── Fase 0: Preflight ──────────────────────────────────────────────────────
log "Fase 0 · Preflight"

mig_need psql pg_recvlogical deno
log "✔ Binários OK (psql, pg_recvlogical, deno)"

WAL_LEVEL=$(src -Atqc "SHOW wal_level") || fail "origem inacessível ($(mig_target "$SRC_DB_URL"))"
[[ "$WAL_LEVEL" == "logical" ]] || fail "wal_level=$WAL_LEVEL (precisa ser 'logical')"
log "✔ wal_level=logical"
dst -Atqc "SELECT 1" >/dev/null || fail "destino inacessível ($(mig_target "$DEST_DB_URL"))"

SLOT_PLUGIN=$(src -Atqc "SELECT plugin FROM pg_replication_slots WHERE slot_name='$CDC_SLOT'")
if [[ -z "$SLOT_PLUGIN" ]]; then
  MAX_SLOTS=$(src -Atqc "SHOW max_replication_slots")
  USED_SLOTS=$(src -Atqc "SELECT count(*) FROM pg_replication_slots")
  log "✔ replication_slots: $USED_SLOTS/$MAX_SLOTS em uso"
  [[ "$USED_SLOTS" -lt "$MAX_SLOTS" ]] || fail "sem slot livre"
fi

# ─── Fase 1: Bootstrap idempotente ──────────────────────────────────────────
log "Fase 1 · Bootstrap (slot + checkpoint table)"

if [[ -z "$SLOT_PLUGIN" ]]; then
  # A criação do slot é o teste real de disponibilidade do plugin na origem.
  src -qc "SELECT pg_create_logical_replication_slot('$CDC_SLOT','$CDC_PLUGIN')" >/dev/null 2>"$CDC_OUT_DIR/.slot-err" \
    || fail "não consegui criar o slot com o plugin '$CDC_PLUGIN': $(tail -n 1 "$CDC_OUT_DIR/.slot-err")"
  SLOT_CREATED=1
  log "✔ Slot criado: $CDC_SLOT ($CDC_PLUGIN)"
elif [[ "$SLOT_PLUGIN" == "$CDC_PLUGIN" ]]; then
  log "✔ Slot já existe: $CDC_SLOT (reutilizando; não será dropado por este run)"
else
  fail "slot $CDC_SLOT já existe com o plugin '$SLOT_PLUGIN' (esperado '$CDC_PLUGIN')"
fi

dst -q -f "$SCRIPT_DIR/checkpoint.sql" >/dev/null 2>&1 || fail "checkpoint.sql falhou no destino"
log "✔ Tabela _migration_cdc_checkpoint pronta"

CKPT_BEFORE=$(dst -Atqc "SELECT count(*) FROM public._migration_cdc_checkpoint")

# ─── Fase 2: Drain time-boxed ───────────────────────────────────────────────
log "Fase 2 · Drain por ${CDC_DRY_RUN_SEC}s"

DRAIN_FILE="$CDC_OUT_DIR/wal-dryrun-$(date -u +%Y%m%dT%H%M%SZ)-$$.json"
PLUGIN_OPTS=()
if [[ "$CDC_PLUGIN" == "wal2json" ]]; then
  PLUGIN_OPTS=(--option=format-version=2 --option=include-lsn=true --option=include-timestamp=true)
fi
mig_pg_split "$SRC_DB_URL"
(
  # exec: o PID em background é o próprio pg_recvlogical (recebe o SIGINT do encerramento)
  [[ -z "$MIG_PG_PASSWORD" ]] || export PGPASSWORD="$MIG_PG_PASSWORD"
  exec pg_recvlogical -d "$MIG_PG_URL" --slot "$CDC_SLOT" --start "${PLUGIN_OPTS[@]}" \
    --file "$DRAIN_FILE" --fsync-interval=1000
) &
DRAIN_PID=$!
sleep 1
kill -0 "$DRAIN_PID" 2>/dev/null || { DRAIN_PID=""; fail "pg_recvlogical não ficou de pé (slot em uso por outro drain?)"; }

# ─── Fase 3: Carga sintética (opcional) ─────────────────────────────────────
if [[ "$SYNTHETIC_WRITES" == "1" ]]; then
  log "Fase 3 · Injetando carga sintética"
  CANARY=1
  CANARY_DDL="CREATE TABLE IF NOT EXISTS public._cdc_dryrun_canary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payload text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now())"
  # a tabela precisa existir nos DOIS lados: o replay não cria tabela
  dst -qc "$CANARY_DDL" >/dev/null || fail "não consegui criar a tabela canário no destino"
  src -q <<SQL >/dev/null || fail "carga sintética falhou na origem"
$CANARY_DDL;
INSERT INTO public._cdc_dryrun_canary(payload)
SELECT 'canary-' || g FROM generate_series(1, 50) g;
UPDATE public._cdc_dryrun_canary SET payload = payload || '-upd'
  WHERE created_at > now() - interval '10 seconds';
DELETE FROM public._cdc_dryrun_canary
  WHERE payload LIKE 'canary-1-%' OR payload LIKE 'canary-2-%';
SQL
  log "✔ 50 inserts + updates + deletes injetados"
fi

sleep "$CDC_DRY_RUN_SEC" & wait $! || true
kill -INT "$DRAIN_PID" 2>/dev/null || true
wait "$DRAIN_PID" 2>/dev/null || true
DRAIN_PID=""
log "✔ Drain encerrado"

WAL_LINES=$(wc -l < "$DRAIN_FILE" 2>/dev/null || echo 0)
WAL_BYTES=$(wc -c < "$DRAIN_FILE" 2>/dev/null || echo 0)
log "✔ WAL capturado: $WAL_LINES linhas / $WAL_BYTES bytes"

# ─── Fase 4: Replay ─────────────────────────────────────────────────────────
log "Fase 4 · Replay idempotente"

REPLAY_LOG="$CDC_OUT_DIR/replay-$(date -u +%Y%m%dT%H%M%SZ).log"
CDC_OUT_DIR="$CDC_OUT_DIR" \
DEST_SUPABASE_URL="$DEST_SUPABASE_URL" \
DEST_SERVICE_ROLE_KEY="$DEST_SERVICE_ROLE_KEY" \
  deno run --allow-env --allow-net --allow-read "$SCRIPT_DIR/replay.ts" \
  | tee "$REPLAY_LOG"

# Segunda passada — DEVE ser 100% skipped (prova de idempotência)
log "Fase 4.b · Replay #2 (deve ser 100% skipped)"
REPLAY2_LOG="$CDC_OUT_DIR/replay2-$(date -u +%Y%m%dT%H%M%SZ).log"
CDC_OUT_DIR="$CDC_OUT_DIR" \
DEST_SUPABASE_URL="$DEST_SUPABASE_URL" \
DEST_SERVICE_ROLE_KEY="$DEST_SERVICE_ROLE_KEY" \
  deno run --allow-env --allow-net --allow-read "$SCRIPT_DIR/replay.ts" \
  | tee "$REPLAY2_LOG"

APPLIED2=$(grep -oE 'applied=[0-9]+' "$REPLAY2_LOG" | tail -1 | cut -d= -f2 || true)
[[ -n "$APPLIED2" ]] || fail "replay #2 não reportou 'applied=N' — não dá para provar idempotência"
[[ "$APPLIED2" == "0" ]] \
  || fail "Idempotência quebrada — 2ª passada aplicou $APPLIED2 (esperado 0)"
log "✔ Idempotência confirmada (applied=0 na 2ª passada)"

# ─── Fase 5: Métricas & Integridade ─────────────────────────────────────────
log "Fase 5 · Métricas"

SLOT_LAG=$(src -Atqc "SELECT pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) FROM pg_replication_slots WHERE slot_name='$CDC_SLOT'")
SLOT_ACTIVE=$(src -Atqc "SELECT active FROM pg_replication_slots WHERE slot_name='$CDC_SLOT'")
CKPT_AFTER=$(dst -Atqc "SELECT count(*) FROM public._migration_cdc_checkpoint")
CKPT_DELTA=$((CKPT_AFTER - CKPT_BEFORE))

CANARY_SRC=0; CANARY_DEST=0
if [[ "$SYNTHETIC_WRITES" == "1" ]]; then
  CANARY_SRC=$(src -Atqc "SELECT count(*) FROM public._cdc_dryrun_canary")
  CANARY_DEST=$(dst -Atqc "SELECT count(*) FROM public._cdc_dryrun_canary" 2>/dev/null || echo "N/A")
fi

# Gates — qualquer um reprovado derruba o dry-run (exit 1)
GATES_FAILED=0
G_WAL=" "; G_CKPT=" "; G_CANARY=" "
if [[ "$WAL_LINES" -gt 0 ]]; then G_WAL=x; else GATES_FAILED=$((GATES_FAILED+1)); fi
# com WAL capturado, o checkpoint tem de ter avançado
if [[ "$WAL_LINES" -eq 0 || "$CKPT_DELTA" -gt 0 ]]; then G_CKPT=x; else GATES_FAILED=$((GATES_FAILED+1)); fi
if [[ "$SYNTHETIC_WRITES" != "1" || "$CANARY_SRC" == "$CANARY_DEST" ]]; then G_CANARY=x; else GATES_FAILED=$((GATES_FAILED+1)); fi

# ─── Fase 6: Relatório ──────────────────────────────────────────────────────
cat > "$REPORT_FILE" <<EOF
# CDC Dry-Run — $(date -u +%Y-%m-%dT%H:%M:%SZ)

| Métrica | Valor |
|---|---|
| Slot | \`$CDC_SLOT\` |
| Slot ativo pós-drain | $SLOT_ACTIVE |
| Lag WAL (origem) | $SLOT_LAG |
| WAL capturado | $WAL_LINES linhas / $WAL_BYTES bytes |
| Checkpoint LSNs antes | $CKPT_BEFORE |
| Checkpoint LSNs após | $CKPT_AFTER |
| Δ Checkpoint | +$CKPT_DELTA |
| Idempotência (replay #2) | applied=$APPLIED2 |
| Canary origem / destino | $CANARY_SRC / $CANARY_DEST |
| Duração drain | ${CDC_DRY_RUN_SEC}s |
| Arquivo WAL | \`$DRAIN_FILE\` |
| Log replay | \`$REPLAY_LOG\` |

## Gates

- [$G_WAL] WAL capturado > 0
- [$G_CKPT] Checkpoint avançou
- [x] Idempotência OK
- [$G_CANARY] Canary origem = destino

## Próximos passos

1. Revisar $REPLAY_LOG por erros de \`upsert\`/\`delete\`
2. Se OK → agendar drill de janela real com \`CDC_DRY_RUN_SEC=1800\`
3. Antes do cutover produtivo: dropar slot \`$CDC_SLOT\` e limpar \`$CDC_OUT_DIR\`
EOF

log "📄 Relatório: $REPORT_FILE"
cat "$REPORT_FILE"

# ─── Resultado (o cleanup roda no trap de saída) ─────────────────────────────
if (( GATES_FAILED > 0 )); then
  fail "Dry-run REPROVADO — $GATES_FAILED gate(s) falharam (veja $REPORT_FILE)"
fi
log "✅ Dry-run concluído com sucesso"
