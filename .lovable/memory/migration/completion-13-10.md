---
name: Migration Completion 13/10 — Excelência Sustentada
description: Rodada 13 de hardening — 8 gaps finais pós-simulação de 300+ cenários (backup drill, CDC ordering, RLS coverage, JWT rotation, WAL archive, pool saturation, extension parity, tz/locale drift).
type: feature
---

# Rodada 13/10 — Excelência Sustentada

## Entregas

1. **Backup Restore Drill** — `scripts/migration/dr/restore-drill.sh`.
   Restaura backup em instância efêmera, compara row counts com produção, gate 0.01%.
2. **CDC Event Ordering Guard** — `scripts/migration/cdc/order-guard.ts`.
   Monotonicidade de LSN + detecção de clock skew (> 2s aborta).
3. **RLS Coverage Enforcer** — `scripts/migration/verify/rls-coverage.sql` + step CI.
   Falha build se qualquer tabela pública sem RLS/policy.
4. **Signing Key Rotation** — `scripts/migration/auth/rotate-jwt.sh` + `docs/SIGNING_KEY_ROTATION.md`.
   Fluxo `prepare → activate → retire` com overlap obrigatório de 24h.
5. **WAL Archive Health** — `scripts/migration/dr/wal-archive-check.sh`.
   Alerta se `last_archived_time` > 5min ou `failed_count` cresce.
6. **Pool Saturation Simulator** — `tests/load/pool-saturation.js` (k6).
   Ramp 0→500 VUs, gate p99 < 500ms, erro < 1%.
7. **Extension Version Parity** — `verify/extensions-versions.sql` + `.sh`.
   Diff JSON de versões de extensões críticas (pg_cron, pgcrypto, pg_net, vector...).
8. **TZ/Locale Drift Guard** — `verify/tz-locale-parity.sql` + `.sh`.
   Compara timezone, lc_collate, lc_ctype, server_encoding.

## Gates de sucesso

- `bash scripts/migration/dr/restore-drill.sh` — exit 0
- `psql -f verify/rls-coverage.sql` — exit 0 (CI enforced)
- `verify/extensions-versions.sh` — exit 0
- `verify/tz-locale-parity.sh` — exit 0
- `k6 run tests/load/pool-saturation.js` — thresholds verdes

## Integração CI

Novo step em `.github/workflows/ci.yml` (`RLS coverage`) roda em toda PR/push.

## Nada foi tocado

- App runtime (UI, hooks, Auth).
- Schema de banco (nenhuma migration).
- Fluxo de reset de senha (já 10/10 na rodada 10).