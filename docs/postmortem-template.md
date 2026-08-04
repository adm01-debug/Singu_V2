# Post-Mortem — {Título do Incidente}

> ⚠️ **ESTE É UM TEMPLATE.** Ao usar, copie este arquivo para `docs/postmortems/AAAA-MM-DD-slug.md` e substitua **todos** os placeholders: `AAAA-MM-DD`, `@nome`, `{Título}`, `Xh Ymin`, `R$ X`, etc. Não publique com placeholders intactos.
>
> 📖 **Referência viva**: veja [`postmortem-example.md`](./postmortem-example.md) para um incidente fictício 100% preenchido como modelo de qualidade.

> **Cultura blameless**: este documento foca em sistemas e processos, não em pessoas. Erros são oportunidades de aprendizado.

## Metadados

| Campo | Valor |
|---|---|
| **Data do incidente** | AAAA-MM-DD |
| **Duração** | Xh Ymin |
| **Severidade** | P1 / P2 / P3 |
| **Incident Commander** | @nome |
| **Autor do post-mortem** | @nome |
| **Status** | Draft / Em revisão / Publicado |
| **Data de publicação** | AAAA-MM-DD (≤48h após resolução) |

## 1. Resumo Executivo

_2-3 frases descrevendo o que aconteceu, o impacto e como foi resolvido. Linguagem acessível para stakeholders não-técnicos._

## 2. Impacto

| Dimensão | Métrica |
|---|---|
| Usuários afetados | N (X% da base ativa) |
| Módulos impactados | Contatos, Pipeline, ... |
| Receita estimada perdida | R$ X (se aplicável) |
| Dados perdidos/corrompidos | Sim/Não — descrever |
| SLO violado | Disponibilidade `external-data` caiu para X% no mês |
| Error budget consumido | X% do mensal |

## 3. Timeline (BRT)

| Hora | Evento | Ator |
|---|---|---|
| HH:MM | Primeiro sinal — alerta `system-health` `unhealthy` | Sistema |
| HH:MM | Engenheiro de plantão notificado via PagerDuty | Sistema |
| HH:MM | IC declara P1, abre war room | @nome |
| HH:MM | Hipótese: deploy X causou regressão | @nome |
| HH:MM | Comunicação inicial publicada na status page | @comms |
| HH:MM | Mitigação: rollback do deploy | @nome |
| HH:MM | `system-health` volta a `healthy` | Sistema |
| HH:MM | Validação: 30 min consecutivos verde | @nome |
| HH:MM | Incidente declarado resolvido; comunicação final | @comms |

## 4. Análise de Causa Raiz (5-Whys)

1. **Por quê?** Usuários receberam HTTP 500 ao salvar contatos.
2. **Por quê?** Edge function `external-data` retornou erro de schema.
3. **Por quê?** Coluna `version` foi removida no banco externo.
4. **Por quê?** Migration manual aplicada sem coordenação.
5. **Por quê?** Falta de gate técnico que bloqueie alterações destrutivas em prod externa.

**Causa raiz**: ausência de processo de change management para o banco externo.

## 5. Fatores Contribuintes

- Monitoramento de schema drift estava em modo "log only", não alertava.
- Runbook não cobria cenário de mudança no banco externo.
- Plantonista era novo e levou 8 min para identificar a função afetada.

## 6. O que funcionou bem

- Detecção automática via `system-health` em <2 min.
- Rollback executado com sucesso em <5 min.
- Comunicação clara e rápida na status page.

## 7. Action Items

| ID | Ação | Owner | Prioridade | Prazo |
|---|---|---|---|---|
| AI-01 | Promover schema-drift para alerta P2 | @dba | P0 | +7 dias |
| AI-02 | Criar canal Slack #change-mgmt-externa | @ops | P1 | +14 dias |
| AI-03 | Adicionar cenário ao RUNBOOK §Troubleshooting | @docs | P1 | +7 dias |
| AI-04 | Onboarding técnico para plantonistas (drill) | @eng-lead | P2 | +30 dias |

> **Regra**: todo action item P0/P1 vira issue rastreada com due date. Sem owner = não conta.

## 8. Lessons Learned

- _Aprendizado 1 — generalizar para o sistema, não para a pessoa._
- _Aprendizado 2 — qual sinal deveria ter alertado mais cedo?_
- _Aprendizado 3 — qual processo precisa mudar?_

## 9. Declaração Blameless

> Este incidente foi causado por uma combinação de fatores sistêmicos. Nenhum indivíduo é responsabilizado. As ações acima visam fortalecer nossos processos para que falhas similares sejam prevenidas ou detectadas mais cedo.

---

**Referências**: [`RUNBOOK.md`](./RUNBOOK.md) • [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md)
