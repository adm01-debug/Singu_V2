---
name: Migration Completion 11/10 (Rodada Final++)
description: Hardening enterprise final — CDC RPO=0, dual-write bake, verify SHA-256, LGPD manifest, brief executivo
type: feature
---

## Entregáveis

### P0 — Continuidade
- `scripts/migration/cdc/` — drain.sh (wal2json) + replay.ts idempotente + checkpoint SQL. RPO=0.
- `supabase/functions/dual-write-proxy/` — mirror opt-in por whitelist, nunca bloqueia caller.

### P1 — Verificação profunda
- `verify/row-diff-deep.ts` — head/tail/random + SHA-256 + HTML.
- `verify/storage-bytes.ts` — SHA-256 byte-level via signed URLs.
- `verify/extensions-parity.sql` — diff textual de versões.

### P2 — Guardrails de IA
- Blueprint no runbook; implementação SQL fica para migração dedicada quando budget for definido.

### P3 — Compliance
- `compliance/lgpd-snapshot.ts` — manifesto HMAC-SHA256.
- `docs/dr/backup-encryption-check.md` — KMS/Object Lock/MFA/replicação.

### P4 — Documentação
- `docs/MIGRATION_EXECUTIVE_BRIEF.md` — 1 página PT-BR.
- Master runbook com checklist 11/10.

## Padrões
- `set -euo pipefail` em todos os shells.
- TS/Deno sem `any`.
- Scripts idempotentes; replay usa checkpoint por LSN.