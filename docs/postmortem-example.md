# Post-Mortem — Indisponibilidade parcial do salvamento de contatos (external-data)

> **Cultura blameless**: este documento foca em sistemas e processos, não em pessoas.
>
> ℹ️ **Este é um exemplo fictício** que demonstra o padrão de qualidade esperado. O incidente abaixo nunca ocorreu — serve apenas como referência de preenchimento para [`postmortem-template.md`](./postmortem-template.md).

## Metadados

| Campo | Valor |
|---|---|
| **Data do incidente** | 2026-03-14 |
| **Duração** | 1h 12min |
| **Severidade** | P1 |
| **Incident Commander** | @ana.souza |
| **Autor do post-mortem** | @bruno.lima |
| **Status** | Publicado |
| **Data de publicação** | 2026-03-15 (≤48h após resolução) |

## 1. Resumo Executivo

Em 14/03/2026, das 14:23 às 15:35 BRT, ~38% dos usuários ativos receberam HTTP 500 ao tentar salvar contatos. A causa foi uma migration manual no banco externo que removeu a coluna `version` usada pelo optimistic locking de `external-data`. Resolvido via rollback coordenado da migration externa e cache-bust da Edge Function. Nenhum dado foi perdido.

## 2. Impacto

| Dimensão | Métrica |
|---|---|
| Usuários afetados | 142 (≈38% da base ativa diária) |
| Módulos impactados | Contatos, Pipeline (escrita de deals), Sequências (enrollment) |
| Receita estimada perdida | Não mensurável — sem checkout direto |
| Dados perdidos/corrompidos | Nenhum (writes falharam atomicamente) |
| SLO violado | Disponibilidade `external-data` caiu para 98.4% no mês (meta 99.5%) |
| Error budget consumido | 73% do budget mensal consumido em um único evento |

## 3. Timeline (BRT)

| Hora | Evento | Ator |
|---|---|---|
| 14:23 | Primeiro sinal — `system-health` marca `external_database` como `down` | Sistema |
| 14:24 | Alerta P1 disparado para canal `#sre-oncall` | Sistema |
| 14:26 | @ana.souza assume IC, abre war room em `#war-room-2026-03-14` | @ana.souza |
| 14:31 | Hipótese 1 descartada: deploy recente do frontend (sem correlação) | @bruno.lima |
| 14:38 | Hipótese 2 confirmada: query falha com `column "version" does not exist` | @carla.dias |
| 14:42 | Status page atualizada: "Salvamento de contatos indisponível" | @ana.souza |
| 14:55 | Identificada migration manual `2026_03_14_drop_version.sql` aplicada às 14:20 | @carla.dias |
| 15:08 | Rollback da migration aplicado no banco externo | @carla.dias |
| 15:18 | Cache da Edge Function `external-data` invalidado | @bruno.lima |
| 15:25 | `system-health` volta a `healthy`; smoke tests passam | Sistema |
| 15:35 | Após 10 min consecutivos verde, incidente declarado resolvido | @ana.souza |
| 15:40 | Comunicação final na status page | @ana.souza |

## 4. Análise de Causa Raiz (5-Whys)

1. **Por quê?** Usuários receberam HTTP 500 ao salvar contatos.
2. **Por quê?** Edge Function `external-data` retornou erro de schema.
3. **Por quê?** Coluna `version` foi removida no banco externo.
4. **Por quê?** Migration manual aplicada via `psql` direto, sem revisão.
5. **Por quê?** Não existe gate técnico que bloqueie ALTER/DROP destrutivos no banco externo de produção.

**Causa raiz**: ausência de processo de change management e gate técnico para o banco externo.

## 5. Fatores Contribuintes

- Schema-drift detector estava em modo "log only", não promovia para alerta P1.
- Runbook §Troubleshooting não cobria cenário de DROP COLUMN no banco externo.
- Plantonista @carla.dias foi onboardada há 6 dias e levou 12 min para localizar a função afetada por falta de familiaridade com o mapa de dependências.

## 6. O que funcionou bem

- Detecção automática via `system-health` em <60 s.
- Rollback executado com sucesso em <20 min do diagnóstico.
- Comunicação clara e rápida na status page (3 atualizações em 1h).
- Optimistic locking impediu corrupção de dados — todos os writes falharam atomicamente.

## 7. Action Items

| ID | Ação | Owner | Prioridade | Prazo |
|---|---|---|---|---|
| AI-01 | Promover schema-drift de "log only" para alerta P1 automático | @dba-team | P0 | 2026-03-22 |
| AI-02 | Criar canal `#change-mgmt-externa` com aprovação obrigatória de 2 reviewers para qualquer DDL | @ops-lead | P0 | 2026-03-29 |
| AI-03 | Adicionar cenário "DROP COLUMN no banco externo" ao RUNBOOK §Troubleshooting | @bruno.lima | P1 | 2026-03-22 |
| AI-04 | Drill de onboarding técnico para plantonistas (mapa de dependências) | @ana.souza | P1 | 2026-04-15 |
| AI-05 | Implementar painel `/admin/error-budget` para visibilidade contínua do consumo | @lovable-sre | P1 | 2026-04-20 ✅ concluído |

> **Regra**: todo action item P0/P1 vira issue rastreada com due date. Sem owner = não conta.

## 8. Lessons Learned

- Detecção rápida só é útil se o tempo de diagnóstico também for rápido — invista em mapa de dependências visual.
- Schemas externos compartilhados são pontos cegos críticos — exigem o mesmo rigor de change management que código.
- Optimistic locking salvou a integridade dos dados — manter como padrão em toda escrita externa.

## 9. Declaração Blameless

> Este incidente foi causado por uma combinação de fatores sistêmicos: ausência de gate técnico, monitoramento em modo passivo e gap de onboarding. Nenhum indivíduo é responsabilizado. As ações acima visam fortalecer nossos processos para que falhas similares sejam prevenidas ou detectadas e mitigadas mais cedo.

---

**Referências**: [`RUNBOOK.md`](./RUNBOOK.md) • [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) • [`postmortem-template.md`](./postmortem-template.md)
