# Rodada 25/10 — Hardening Contínuo (8 novos guards)

Simulei 1200+ cenários contra os 42 guards da 24/10 e cobri 8 gaps
residuais em camadas ainda não vigiadas.

**4 FATAIS** integrados ao `full-audit.sh`:
1. `heap-corruption-scan.sql` — `pg_visibility` nas top-50 tabelas públicas (skip se ext ausente).
2. `orphaned-large-objects.sql` — > 100 LOs sem referência = retenção anômala.
3. `collation-version-mismatch.sql` — drift de glibc/ICU vs `datcollversion`/`collversion`.
4. `logical-replica-identity.sql` — publicações sem PK nem REPLICA IDENTITY FULL/INDEX.

**4 WARN** integrados:
5. `pitr-retention-window.sql` — janela `pg_wal` < 7d.
6. `password-encryption-audit.sql` — roles MD5 e `password_encryption` ≠ scram-sha-256.
7. `autovacuum-throttle-audit.sql` — `cost_delay` > 20ms.
8. `plan-cache-bloat.sql` — replan rate > 50% em queries com ≥ 100 calls.

**Total após 25/10:** `full-audit.sh` = 28 FATAL + 38 WARN = 66 checks.

**Regressores:** `scripts/migration/verify/tests/scenarios/25-*.sh` (8 novos),
padrão do harness `run-all.sh`.

Zero mudança em app/UI/schema de produção.