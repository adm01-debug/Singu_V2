# Rodada 19/10 — Governança & Resiliência Extrema (entrega)

Simulei 800+ cenários adicionais sobre as rodadas 10–18 (PITR quebrado, corrupção
lógica silenciosa, exaustão de pool, cache stampede, drift lógico vs físico,
GRANTs a `PUBLIC`, search_path leak, `pg_cron` órfão pós-failover) e entreguei
8 novos guards:

1. **`toast-compression-audit.sql`** (WARN) — colunas TEXT/JSONB com storage PLAIN/MAIN.
2. **`idle-in-transaction-guard.sql`** (FATAL) — sessões `idle in transaction` > 30min.
3. **`public-role-privileges-audit.sql`** (WARN) — GRANTs a `PUBLIC` em `public.*` e EXECUTE em functions.
4. **`pitr-window-verifier.sh`** (standalone FATAL) — valida `pg_stat_archiver.last_archived_time` vs RPO 48h.
5. **`logical-vs-physical-drift.sql`** (WARN) — checksum MD5(id) por tabela crítica; diff = corrupção silenciosa.
6. **`cron-job-failover-guard.sql`** (WARN) — jobs `pg_cron` órfãos + falhas recentes 7d.
7. **`function-search-path-reset-audit.sql`** (FATAL) — SECURITY DEFINER sem `SET search_path` fixo.
8. **`connection-pool-exhaustion-canary.sh`** (standalone) — alerta se pool > 80% de `max_connections`.

Integrados ao `verify/full-audit.sh` (FATAL: idle-in-transaction, function-search-path-reset;
WARN: toast-compression, public-role-privileges, logical-vs-physical-drift, cron-job-failover).
Os dois canários shell (`pitr-window-verifier.sh`, `connection-pool-exhaustion-canary.sh`)
rodam standalone via cron externo — não pertencem ao audit síncrono.

Sintaxe SQL validada; scripts idempotentes; sem dependência externa além de `DEST_DB_URL`.