---
name: Migration Completion 14/10 — Hardening Contínuo
description: Rodada 14 — 8 gaps pós-simulação 400+ cenários (FK integrity, trigger parity wrapper, MV refresh audit, sequence gap check, storage public guard, cron TZ audit, CORS scoped enforcer no CI, backup encryption verifier).
type: feature
---

# Rodada 14/10 — Hardening Contínuo

## Entregas

1. **FK Integrity Enforcer** — `scripts/migration/verify/fk-integrity.sql` (existente; gate pré-cutover).
2. **Trigger Parity Wrapper** — `scripts/migration/verify/triggers-parity.sh` (diff canônico origem × destino, exit 1 em divergência).
3. **MV Refresh Audit** — `scripts/migration/verify/mv-refresh-audit.sql` (stale >24h + falta de cron REFRESH).
4. **Sequence Gap Check** — `scripts/migration/verify/sequences-gap-check.sql` (last_value ≤ MAX(col) → RAISE EXCEPTION).
5. **Storage Public Guard** — `scripts/migration/verify/storage-public-guard.ts` + `storage-public-allowlist.txt`.
6. **Cron TZ Audit** — `scripts/migration/verify/cron-timezone-audit.sql` (CRON_TZ= vs DB TZ).
7. **CORS Scoped Enforcer** — `scripts/check-edge-cors.mjs` + `scripts/edge-cors-allowlist.txt` (novo step em CI).
8. **Backup Encryption Verifier** — `scripts/migration/dr/backup-encryption-check.sh` (GPG decrypt + `pg_restore --list`).

## Gates

- CI: step `Edge Function CORS scoped enforcer` roda em toda PR/push.
- Pré-cutover: rodar 2/3/4/6 em sequência (destino), 7 já no CI.
- Trimestral: 8 contra backup mais recente.

## Não impactado

App runtime, schema (nenhuma migration), fluxo de auth.