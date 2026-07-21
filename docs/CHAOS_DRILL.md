# Chaos Drill Runbook

Simulações controladas em STAGING para validar que o time SRE responde corretamente
às falhas mais prováveis durante a janela de migração.

> **NUNCA** rode `chaos/inject.sh` em produção. O script exige `STAGING_CONFIRM=1`.

## Cenários e resposta esperada

| # | Cenário | Injeção | Detecção esperada | MTTR alvo |
|---|---------|---------|-------------------|-----------|
| 1 | `kill-drain` | Mata `pg_recvlogical` | `cdc/lag-watch.sh` alerta em <30s; `AUTO_DRAIN=1` reanima | <2 min |
| 2 | `corrupt-checkpoint` | Insere LSN inválido em `_migration_cdc_checkpoint` | `cdc/replay.ts` continua (idempotente por PK) | 0 (transparente) |
| 3 | `revoke-grant` | REVOKE SELECT em `public.contacts` | `smoke-tests.ts` falha; log em `error_logs` | <10 min |
| 4 | `slot-full` | Pausa drain (SIGSTOP) | `lag-watch.sh` detecta `lag_bytes` crescente; auto-drain | <5 min |
| 5 | `dns-stale` | `dns-multi-region.sh` com EXPECTED errado | Script sai 1, lista resolvers divergentes | <1 min |

## Executar

```bash
cd scripts/migration
export STAGING_CONFIRM=1
SCENARIO=kill-drain          ./chaos/inject.sh
SCENARIO=corrupt-checkpoint  ./chaos/inject.sh
SCENARIO=revoke-grant        ./chaos/inject.sh
SCENARIO=slot-full           ./chaos/inject.sh
SCENARIO=dns-stale           ./chaos/inject.sh
```

## Critérios de aprovação

- [ ] Todos os 5 cenários detectados dentro do MTTR alvo
- [ ] `system_alerts` contém 1 registro por cenário disparado
- [ ] Nenhuma linha perdida (comparar `compare-counts.sh` antes/depois)
- [ ] Runbook revisado com o plantonista de turno

## Frequência

- Antes de cada janela de migração (release-blocker)
- Trimestralmente como DR drill
- Sempre que um novo cenário for identificado em pós-mortem