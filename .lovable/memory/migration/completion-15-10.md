---
name: Migration Completion 15/10 — Hardening Sustentado
description: Rodada 15 — 8 gaps pos-simulacao 500+ cenarios (replication lag guard, grants parity, logical publication guard, invalid indexes guard no CI, autovacuum audit, bloat monitor, planner stats freshness, query plan regression baseline).
type: feature
---

# Rodada 15/10 — Hardening Sustentado

## Entregas

1. **Replication Lag Guard** — `verify/replication-lag-guard.sql` (falha se replay_lag>30s ou write_lag>10s).
2. **GRANTs Parity** — `verify/grants-parity.sql` + `verify/grants-parity.sh` (diff canonico de privilegios PostgREST).
3. **Logical Publication Guard** — `verify/logical-publication-guard.sql` (impede CDC drenar vazio).
4. **Invalid Indexes Guard** — `verify/invalid-indexes-guard.sql` (integrado ao CI; falha se `indisvalid=false`).
5. **Autovacuum Audit** — `verify/autovacuum-audit.sql` (sinaliza tabelas com autovacuum desligado).
6. **Bloat Monitor** — `verify/bloat-monitor.sql` (dead_ratio>20% em tabelas >100MB).
7. **Planner Stats Freshness** — `verify/planner-stats-freshness.sh` (ANALYZE + verificacao de last_analyze).
8. **Query Plan Regression Baseline** — `verify/query-plan-regression.sql` (top-30 queries via pg_stat_statements).

## Gates

- CI: step `Invalid indexes guard` roda quando `PGHOST` disponivel.
- Pre-cutover: rodar 1/2/3 (paridade origem x destino) e 4/5/6/7 (saude destino).
- Pos-cutover: 8 como baseline; re-executar D+1, D+7, D+30 para detectar regressao.

## Nao impactado

App runtime, schema (nenhuma migration), fluxo de auth.