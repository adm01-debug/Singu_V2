# Runbooks — DB Guards (Rodada 26/10)

1 secao por alerta acionavel. Validado por `check-runbook-coverage.sh`.

## dead-man-switch
**Sintoma:** `guard_last_run_timestamp_seconds` sem update >2h.
**Diagnostico:** `systemctl status cron`; `tail /var/log/syslog | grep full-audit`.
**Mitigacao:** restart cron ou re-execucao manual.
**Escalation:** on-call DBA se >4h.

## exporter-down
**Sintoma:** `guard_exporter_up` ausente >15min.
**Mitigacao:** `systemctl restart node_exporter`.

## flapping
**Sintoma:** `changes(guard_status[1h]) > 5`.
**Mitigacao:** silence 2h + ticket investigativo.

## warn-generico
**Sintoma:** WARN persistente >15min.
**Diagnostico:** `/tmp/full-audit-*.log` -> `WARNING:` do guard.

## slo-fast-burn
**Sintoma:** 2% do error budget em 1h.
**Mitigacao:** freeze de deploys + DBA on-call.

## slo-slow-burn
**Sintoma:** 5% do budget em 6h. Ticket P2.

## invalid-indexes-guard
**Sintoma:** indice INVALID em `pg_index`. **Mitigacao:** `REINDEX INDEX CONCURRENTLY`.

## tables-without-pk
**Sintoma:** tabela public sem PK. **Mitigacao:** `ALTER TABLE ADD PRIMARY KEY`.

## not-valid-constraints
**Sintoma:** constraint NOT VALID >7d. **Mitigacao:** `ALTER TABLE VALIDATE CONSTRAINT`.

## security-definer-audit
**Sintoma:** SECURITY DEFINER sem `SET search_path`. **Mitigacao:** `ALTER FUNCTION ... SET search_path = pg_catalog, public`.

## replication-slots-guard
**Sintoma:** slot orfao retendo WAL. **Mitigacao:** `pg_drop_replication_slot`.

## long-running-tx-guard
**Sintoma:** tx >1h. **Mitigacao:** `pg_cancel_backend(pid)`.

## prepared-xacts-guard
**Sintoma:** prepared xact orfa. **Mitigacao:** `ROLLBACK PREPARED '<gid>'`.

## function-volatility-audit
**Sintoma:** funcao IMMUTABLE mutavel. **Mitigacao:** `ALTER FUNCTION ... VOLATILE`.

## idle-in-transaction-guard
**Sintoma:** idle-in-tx >30min. **Mitigacao:** `pg_terminate_backend`.

## function-search-path-reset-audit
**Sintoma:** SD com `search_path=public`. **Mitigacao:** resetar para `pg_catalog, public` ou vazio.

## multixact-wraparound-guard
**Sintoma:** mxid_age >200M. **Mitigacao:** `VACUUM FREEZE` agressivo.

## datfrozenxid-age-guard
**Sintoma:** datfrozenxid >1.5B. **Escalation:** IMEDIATA (shutdown iminente).

## access-exclusive-locks-guard
**Sintoma:** AccessExclusive >5min. **Mitigacao:** abortar DDL/backup se possivel.

## wal-level-logical-guard
**Sintoma:** `wal_level!=logical`. **Mitigacao:** `ALTER SYSTEM SET wal_level=logical` + restart.

## sequence-overflow-guard
**Sintoma:** sequence >90% teto. **Mitigacao:** migrar coluna para bigint.

## index-corruption-amcheck
**Sintoma:** `bt_index_check` falhou. **Mitigacao:** `REINDEX CONCURRENTLY`; restore se heap tambem corrompido.

## archive-command-health
**Sintoma:** archive_command falhando. **Escalation:** RPO em risco.

## dead-tuple-ratio-guard
**Sintoma:** >40% dead tuples. **Mitigacao:** `VACUUM (ANALYZE)`.

## checksum-failures-guard
**Sintoma:** checksum_failures>0 ou checksums off. **Mitigacao:** restore + investigar hardware.

## relfrozenxid-table-guard
**Sintoma:** relfrozenxid >1.5B. **Mitigacao:** `VACUUM FREEZE <tabela>`.

## replication-slot-idle-guard
**Sintoma:** slot idle retendo WAL. **Mitigacao:** dropar se orfao.

## ssl-enforcement-audit
**Sintoma:** conexoes plaintext. **Mitigacao:** `pg_hba.conf` -> `hostssl`.

## heap-corruption-scan
**Sintoma:** paginas heap com visibility inconsistente. **Mitigacao:** `VACUUM (DISABLE_PAGE_SKIPPING)`.

## orphaned-large-objects
**Sintoma:** >100 LO orfaos. **Mitigacao:** `vacuumlo`.

## collation-version-mismatch
**Sintoma:** `datcollversion` divergente. **Mitigacao:** `REINDEX` + `REFRESH COLLATION VERSION`.

## logical-replica-identity
**Sintoma:** publicacao sem PK nem REPLICA IDENTITY FULL. **Mitigacao:** `ALTER TABLE ... REPLICA IDENTITY FULL`.

## logical-vs-physical-drift
**Sintoma:** checksums divergentes. **Mitigacao:** ressincronizar replica logica.

## timeline-divergence-guard
**Sintoma:** timeline_id divergente. **Mitigacao:** reconstruir standby.
## ai-gateway-health-slow
**Sintoma:** p95 da RPC `get_ai_gateway_health` > 800ms por 10min. **Mitigação:** conferir bloat/partições de `ai_gateway_metrics`, reduzir janela do heatmap, checar contenção em `system_alerts`.

## rpc-perf-degradation
**Sintoma:** p95(1h) de qualquer RPC instrumentada ≥ 1,5× o baseline de 24h. **Mitigação:** identificar RPC no painel `/admin/error-budget` (card "Top 5 RPCs mais lentas"), rodar `EXPLAIN (ANALYZE, BUFFERS)` na chamada afetada, avaliar índices ou planos que mudaram, verificar cargas concorrentes anômalas.

## rpc-plan-regression

**Sintoma:** card "Snapshots de plano de execução" (`/admin/error-budget`) mostra badge
`plano alterado` para uma RPC, geralmente junto com `RpcPerfDegradation`.

**Diagnóstico**
1. `SELECT rpc_name, reason, total_cost, execution_ms, captured_at FROM public.get_rpc_plan_snapshots('<rpc>', 10);`
2. Compare os dois últimos `plan` (jsonb) procurando por `Seq Scan` que antes era `Index Scan`,
   ou explosão de `Total Cost`.

**Mitigação**
- `ANALYZE public.<tabela>;` quando as estatísticas estiverem desatualizadas.
- Recriar/validar índice ausente; conferir `scripts/migration/verify/invalid-indexes-guard.sql`.
- Captura manual: `SELECT public.capture_rpc_plan('<rpc>', 'manual');` (allowlist rígida).

**Notas**
- Cron `capture-degraded-rpc-plans` roda a cada 15 min e só grava quando o hash estrutural muda.
- Retenção: 30 dias. `reason` com sufixo `+estimated` = plano sem ANALYZE (RPC admin-only).
