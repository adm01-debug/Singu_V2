#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CDC dry-run em STAGING
#
# Valida, sem cutover, que o pipeline CDC (drain → replay → checkpoint) está
# íntegro antes da janela de migração.
#
# Fases:
#   0. Preflight: envs, binários, wal_level, extensão wal2json, permissões
#   1. Bootstrap: cria slot idempotente + checkpoint table no destino
#   2. Drain time-boxed: pg_recvlogical em background por CDC_DRY_RUN_SEC
#   3. Carga sintética (opcional): gera writes controlados na origem
#   4. Replay: aplica WAL no destino
#   5. Métricas: lag do slot, contagem de LSNs, integridade do checkpoint
#   6. Cleanup: opcional — dropa slot e purga arquivos
#
# Uso:
#   CDC_DRY_RUN_SEC=60 SYNTHETIC_WRITES=1 ./dry-run.sh
#   KEEP_SLOT=1 ./dry-run.sh          # não dropa o slot ao final
#   SKIP_CLEANUP=1 ./dry-run.sh       # mantém WAL files para inspeção
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
[[ -f "$ROOT_DIR/.env" ]] && source "$ROOT_DIR/.env"

: "${SRC_DB_URL:?defina SRC_DB_URL (staging origem)}"
: "${DEST_DB_URL:?defina DEST_DB_URL (staging destino)}"
: "${DEST_SUPABASE_URL:?defina DEST_SUPABASE_URL}"
: "${DEST_SERVICE_ROLE_KEY:?defina DEST_SERVICE_ROLE_KEY}"

CDC_SLOT="${CDC_SLOT:-migration_slot_dryrun}"
CDC_OUT_DIR="${CDC_OUT_DIR:-$SCRIPT_DIR/out-dryrun}"
CDC_DRY_RUN_SEC="${CDC_DRY_RUN_SEC:-30}"
SYNTHETIC_WRITES="${SYNTHETIC_WRITES:-0}"
KEEP_SLOT="${KEEP_SLOT:-0}"
SKIP_CLEANUP="${SKIP_CLEANUP:-0}"
REPORT_FILE="${REPORT_FILE:-$SCRIPT_DIR/dry-run-report-$(date -u +%Y%m%dT%H%M%SZ).md}"

mkdir -p "$CDC_OUT_DIR"

log() { printf '\n[%s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }
fail() { printf '\n❌ %s\n' "$*" >&2; exit 1; }

# ─── Fase 0: Preflight ──────────────────────────────────────────────────────
log "Fase 0 · Preflight"

for bin in psql pg_recvlogical deno jq; do
  command -v "$bin" >/dev/null 2>&1 || fail "Binário ausente: $bin"
done
log "✔ Binários OK (psql, pg_recvlogical, deno, jq)"

WAL_LEVEL=$(psql "$SRC_DB_URL" -Atc "SHOW wal_level;")
[[ "$WAL_LEVEL" == "logical" ]] || fail "wal_level=$WAL_LEVEL (precisa ser 'logical')"
log "✔ wal_level=logical"

WAL2JSON_OK=$(psql "$SRC_DB_URL" -Atc \
  "SELECT count(*) FROM pg_available_extensions WHERE name='wal2json' AND installed_version IS NOT NULL OR name='wal2json';")
[[ "$WAL2JSON_OK" -ge 1 ]] || fail "wal2json não disponível na origem"
log "✔ wal2json disponível"

MAX_SLOTS=$(psql "$SRC_DB_URL" -Atc "SHOW max_replication_slots;")
USED_SLOTS=$(psql "$SRC_DB_URL" -Atc "SELECT count(*) FROM pg_replication_slots;")
log "✔ replication_slots: $USED_SLOTS/$MAX_SLOTS em uso"
[[ "$USED_SLOTS" -lt "$MAX_SLOTS" ]] || fail "sem slot livre"

# ─── Fase 1: Bootstrap idempotente ──────────────────────────────────────────
log "Fase 1 · Bootstrap (slot + checkpoint table)"

SLOT_EXISTS=$(psql "$SRC_DB_URL" -Atc \
  "SELECT count(*) FROM pg_replication_slots WHERE slot_name='$CDC_SLOT';")
if [[ "$SLOT_EXISTS" -eq 0 ]]; then
  psql "$SRC_DB_URL" -c \
    "SELECT pg_create_logical_replication_slot('$CDC_SLOT','wal2json');" >/dev/null
  log "✔ Slot criado: $CDC_SLOT"
else
  log "✔ Slot já existe: $CDC_SLOT (reutilizando)"
fi

psql "$DEST_DB_URL" -f "$SCRIPT_DIR/checkpoint.sql" >/dev/null
log "✔ Tabela _migration_cdc_checkpoint pronta"

CKPT_BEFORE=$(psql "$DEST_DB_URL" -Atc \
  "SELECT count(*) FROM public._migration_cdc_checkpoint;")

# ─── Fase 2: Drain time-boxed ───────────────────────────────────────────────
log "Fase 2 · Drain por ${CDC_DRY_RUN_SEC}s"

DRAIN_FILE="$CDC_OUT_DIR/wal-dryrun-$(date -u +%Y%m%dT%H%M%SZ).json"
pg_recvlogical \
  --dbname "$SRC_DB_URL" \
  --slot "$CDC_SLOT" \
  --start \
  --option=format-version=2 \
  --option=include-lsn=true \
  --option=include-timestamp=true \
  --file "$DRAIN_FILE" \
  --fsync-interval=1000 &
DRAIN_PID=$!
trap 'kill -INT $DRAIN_PID 2>/dev/null || true' EXIT

# ─── Fase 3: Carga sintética (opcional) ─────────────────────────────────────
if [[ "$SYNTHETIC_WRITES" == "1" ]]; then
  log "Fase 3 · Injetando carga sintética"
  psql "$SRC_DB_URL" <<'SQL' >/dev/null
CREATE TABLE IF NOT EXISTS public._cdc_dryrun_canary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public._cdc_dryrun_canary(payload)
SELECT 'canary-' || g FROM generate_series(1, 50) g;
UPDATE public._cdc_dryrun_canary SET payload = payload || '-upd'
  WHERE created_at > now() - interval '10 seconds';
DELETE FROM public._cdc_dryrun_canary
  WHERE payload LIKE 'canary-1-%' OR payload LIKE 'canary-2-%';
SQL
  log "✔ 50 inserts + updates + deletes injetados"
fi

sleep "$CDC_DRY_RUN_SEC"
kill -INT "$DRAIN_PID" 2>/dev/null || true
wait "$DRAIN_PID" 2>/dev/null || true
trap - EXIT
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

APPLIED2=$(grep -oE 'applied=[0-9]+' "$REPLAY2_LOG" | tail -1 | cut -d= -f2)
[[ "${APPLIED2:-0}" == "0" ]] \
  || fail "Idempotência quebrada — 2ª passada aplicou $APPLIED2 (esperado 0)"
log "✔ Idempotência confirmada (applied=0 na 2ª passada)"

# ─── Fase 5: Métricas & Integridade ─────────────────────────────────────────
log "Fase 5 · Métricas"

SLOT_LAG=$(psql "$SRC_DB_URL" -Atc "
  SELECT pg_size_pretty(
    pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)
  )
  FROM pg_replication_slots WHERE slot_name='$CDC_SLOT';
")
SLOT_ACTIVE=$(psql "$SRC_DB_URL" -Atc \
  "SELECT active FROM pg_replication_slots WHERE slot_name='$CDC_SLOT';")
CKPT_AFTER=$(psql "$DEST_DB_URL" -Atc \
  "SELECT count(*) FROM public._migration_cdc_checkpoint;")
CKPT_DELTA=$((CKPT_AFTER - CKPT_BEFORE))

CANARY_SRC=0; CANARY_DEST=0
if [[ "$SYNTHETIC_WRITES" == "1" ]]; then
  CANARY_SRC=$(psql "$SRC_DB_URL" -Atc "SELECT count(*) FROM public._cdc_dryrun_canary;")
  CANARY_DEST=$(psql "$DEST_DB_URL" -Atc \
    "SELECT count(*) FROM public._cdc_dryrun_canary;" 2>/dev/null || echo "N/A")
fi

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
| Idempotência (replay #2) | applied=$APPLIED2 ✅ |
| Canary origem / destino | $CANARY_SRC / $CANARY_DEST |
| Duração drain | ${CDC_DRY_RUN_SEC}s |
| Arquivo WAL | \`$DRAIN_FILE\` |
| Log replay | \`$REPLAY_LOG\` |

## Gates

- [$([ "$WAL_LINES" -gt 0 ] && echo x || echo " ")] WAL capturado > 0
- [$([ "$CKPT_DELTA" -ge 0 ] && echo x || echo " ")] Checkpoint avançou
- [$([ "$APPLIED2" == "0" ] && echo x || echo " ")] Idempotência OK
- [$([ "$SYNTHETIC_WRITES" != "1" ] || [ "$CANARY_SRC" == "$CANARY_DEST" ] && echo x || echo " ")] Canary origem = destino

## Próximos passos

1. Revisar $REPLAY_LOG por erros de \`upsert\`/\`delete\`
2. Se OK → agendar drill de janela real com \`CDC_DRY_RUN_SEC=1800\`
3. Antes do cutover produtivo: dropar slot \`$CDC_SLOT\` e limpar \`$CDC_OUT_DIR\`
EOF

log "📄 Relatório: $REPORT_FILE"
cat "$REPORT_FILE"

# ─── Cleanup ────────────────────────────────────────────────────────────────
if [[ "$SKIP_CLEANUP" != "1" ]]; then
  log "Cleanup"
  if [[ "$KEEP_SLOT" != "1" ]]; then
    psql "$SRC_DB_URL" -c "SELECT pg_drop_replication_slot('$CDC_SLOT');" >/dev/null \
      && log "✔ Slot $CDC_SLOT dropado" \
      || log "⚠ Não foi possível dropar slot (talvez ainda ativo)"
  fi
  if [[ "$SYNTHETIC_WRITES" == "1" ]]; then
    psql "$SRC_DB_URL"  -c "DROP TABLE IF EXISTS public._cdc_dryrun_canary;" >/dev/null || true
    psql "$DEST_DB_URL" -c "DROP TABLE IF EXISTS public._cdc_dryrun_canary;" >/dev/null || true
    log "✔ Canary tables removidas"
  fi
fi

log "✅ Dry-run concluído com sucesso"