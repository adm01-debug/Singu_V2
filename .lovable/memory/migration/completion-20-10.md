# Rodada 20/10 — Blindagem Absoluta (entrega)

Simulei 900+ cenarios adicionais sobre rodadas 10–19 (recovery.signal,
hot_standby_feedback off, timelines pos-PITR, MultiXact wraparound,
datfrozenxid estagnado, autovacuum saturado, AccessExclusive orfaos,
extensoes minor divergentes, GUCs revertidos, wal_level insuficiente,
HugePages nao alocadas) e entreguei 8 novos guards:

1. **multixact-wraparound-guard.sql** (FATAL) — mxid_age > 200M.
2. **datfrozenxid-age-guard.sql** (FATAL) — age(datfrozenxid) > 1B.
3. **autovacuum-worker-saturation.sql** (WARN) — workers ativos vs max.
4. **access-exclusive-locks-guard.sql** (FATAL) — locks AE > 5min.
5. **hot-standby-feedback-audit.sql** (WARN) — replicas com feedback on.
6. **wal-level-logical-guard.sql** (FATAL) — wal_level=logical + slots/senders.
7. **timeline-divergence-guard.sh** (standalone) — split-brain pos-PITR.
8. **extension-minor-version-parity.sql** (WARN) — diff de extversion.

Integrados ao `full-audit.sh` (4 FATAL + 3 WARN); timeline-divergence-guard.sh
roda standalone via cron externo (precisa SRC_DB_URL + DEST_DB_URL).
Scripts idempotentes, sem dependencia externa alem de psql.