---
name: Migration Completion 10/10
description: Rodada final de excelência da migração — 10 melhorias entregues (freeze, DNS, parity, monitoring, rollback, DR, postmortem)
type: feature
---

Pipeline de migração Supabase→Supabase atingiu 10/10 com:

**P0 — Cutover seguro**
- `scripts/migration/cutover/freeze-origin.sh` (revoke + snapshot de privilégios + unschedule crons)
- `scripts/migration/cutover/dns-flip-checklist.md`
- `scripts/migration/verify/dns-propagation.sh` (6 resolvers globais)

**P1 — Parity**
- `verify/sequences-audit.sql` (setval batch para todas sequences owned)
- `verify/rls-parity.ts` (diff canônico pg_policies origem×destino)
- `verify/triggers-parity.sql` (triggers + md5 de functions)

**P2 — Observabilidade pós-cutover**
- `monitoring/post-cutover-watch.sh` (loop 24h com fila regen, heartbeat, storage/edge health)
- `monitoring/synthetic-checks.ts` (5 jornadas E2E + report Sentry via DSN)

**P3 — Rollback & DR**
- `rollback/full-restore.sh` (dry-run + dupla confirmação + prompt RESTAURAR)
- `docs/dr/backup-strategy.md` (RPO 15min / RTO 2h, S3 Object Lock, cross-region)

**P4 — Postmortem**
- `docs/MIGRATION_POSTMORTEM_TEMPLATE.md` (timeline, métricas, RCA, action items)

MASTER_RUNBOOK atualizado com todos os itens no checklist final.