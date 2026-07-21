# Migração Supabase — Brief Executivo

> **Público:** stakeholders não-técnicos. **Extensão:** 1 página. **Versão:** 1.0.

## O que estamos fazendo

Migração completa da plataforma (banco, autenticação, funções, arquivos) de um
ambiente Supabase para outro, sem perder dados e com o menor downtime possível.

## Números-chave

| Métrica | Meta | Como garantimos |
|---|---|---|
| RPO (perda máx.) | **0** | CDC WAL logical durante a janela |
| RTO (recuperação) | **2h** | Snapshot + `full-restore.sh` |
| Janela planejada | **4h** (sáb 02h BRT) | Runbook cronometrado com buffer 23min |
| Downtime esperado | **<15min** | Freeze parcial + flip DNS + smoke |

## Riscos residuais e mitigação

1. **DNS lento** → `verify/dns-propagation.sh` monitora 6 resolvers.
2. **Divergência silenciosa** → SHA-256 estratificado + byte-level em Storage.
3. **Custos IA runaway** → circuit breaker desliga cron ao estourar budget.
4. **Rollback pós-flip** → `full-restore.sh` com dupla confirmação, RTO 2h.

## Plano de comunicação

| T | Canal | Mensagem |
|---|---|---|
| D-7 | Email + banner | "Manutenção em [data], 02h–06h BRT" |
| D-1 | Slack #incidents | Confirmar janela + linkar runbook |
| T-0 | Status page | "Manutenção em andamento" |
| T+downtime | Status page | "Sistema restaurado" |
| T+24h | Email | Postmortem público (se aplicável) |

## Compliance

- **LGPD**: manifesto assinado (`compliance/lgpd-snapshot.ts`).
- **Auditoria**: 100% das operações em `audit_log` particionado.
- **Backups**: KMS rotation, Object Lock 30d, replicação cross-region.

## Decisões pendentes

- [ ] Confirmar janela definitiva com CEO/CTO
- [ ] Aprovar rollback automático vs manual pós-T+30min
- [ ] Autorizar mensagem no status page público

---
*Owner: Time de Plataforma. Última atualização: 2026-07-21.*