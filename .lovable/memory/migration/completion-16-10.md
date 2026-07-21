---
name: Migration Completion 16/10 — Governanca Profunda
description: Rodada 16 — 8 gaps pos-simulacao 600+ cenarios (replication slots orfaos, security definer sem search_path, NOT VALID constraints, long-running tx, tabelas sem PK, FDW credenciais plaintext, pg_stat_statements config, log retention) + orquestrador full-audit.sh.
type: feature
---

# Rodada 16/10 — Governanca Profunda

## Entregas
1. **Replication Slots Guard** — detecta slot inativo retendo >10GB WAL.
2. **Security Definer Audit** — falha se SECURITY DEFINER sem search_path fixo.
3. **NOT VALID Constraints** — detecta constraints nao validadas.
4. **Long-Running TX Guard** — flag tx >1h (risco xid wraparound).
5. **Tables Without PK** — logical replication quebra sem PK.
6. **FDW Credentials Audit** — password plaintext em pg_user_mapping.
7. **pg_stat_statements Config** — track=all + track_utility=on.
8. **Log Retention Audit** — alerta LGPD para log_statement=all.

## Orquestrador
`verify/full-audit.sh` executa a bateria contra `DEST_DB_URL`. FATAL falha exit code; WARN so imprime.

## Nao impactado
App runtime, schema (nenhuma migration), CI (opcional integrar posteriormente).