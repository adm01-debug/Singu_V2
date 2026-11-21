# Linha de base do estado real — Singu_V2

> Documento de fundação da auditoria. Tudo que for medido a partir daqui
> compara contra ESTA linha. Fonte: `inventario/estado/` (gerado semanalmente
> pelo workflow `inventario-estado-semanal`). Medição de referência:
> **2026-11-13T11:20:33Z** (`banco.json`), dados de rotas/edges do mesmo ciclo.

## Banco (produção / preview do main)

| Métrica | Valor |
| --- | --- |
| Tabelas `public` | 406 |
| Policies de RLS | 1477 |
| Tabelas **sem** RLS | 0 |
| Triggers `public` | 435 |
| Views `public` | 139 |
| Funções `public` | 1382 |
| Crons ativos | 40 |
| Postgres | 17.6 |
| Tamanho | ~3,15 GB |
| Migrations no repo | ver `supabase/migrations/` (base restaurada pela #267) |

## Front

| Métrica | Valor |
| --- | --- |
| Rotas (urls) | 114 (12 públicas, 1 autenticada, 77 protegidas, 24 admin) |
| Itens menu sidebar | 33 |
| Itens menu mobile | 12 |
| Hooks distintos | 528 |
| Problemas de rota | 1 |

### Problema de rota conhecido

| tipo | arquivo | detalhe |
| --- | --- | --- |
| pagina_sem_rota | `src/pages/admin/Observability.tsx` | arquivo em `src/pages/` que nenhuma rota usa (candidato a código morto) |

## Edge functions

| Métrica | Valor |
| --- | --- |
| Total | 109 |
| Sem chamador no repo | 14 |

### Classificação das 14 edges sem chamador no repo (auditoria 2026-11)

> Método: auditoria adversarial (`docs/estado/09_VERIFICACAO_ADVERSARIAL_ORFAOS.md`,
> 27 alvos, 10+1 testes/edge) cruzada com chamadores reais no front/hooks e datas de
> criação. Nenhuma é cron ativo (40 jobs auditados no mesmo ciclo).

**VIVAS — mantidas (chamador real ou único caminho):**

| Edge | Veredito | Evidência |
| --- | --- | --- |
| `audit-analytics` | VIVA | hook `useAuditAnalytics.ts` → `functions.invoke`; montado em `AdminAuditTrail.tsx` via `AuditAnalyticsPanel` (#255, 18/nov, pós-auditoria) |
| `attribution-calculator` | VIVA | único caminho funcional: `compute_attribution` com EXECUTE revogado de `authenticated` (só `service_role`) |
| `crm-automation-monitor` | VIVA | único escritor de `crm_automation_logs`; widget na home (`Index.tsx`) |
| `submit-signature` | VIVA | `PublicSignaturePage.tsx` |
| `mcp-server` | VIVA | `McpInstructionsCard.tsx` |

**Webhooks / crons externos — mantidas (consumo fora do repo):**

| Edge | Veredito | Evidência |
| --- | --- | --- |
| `bitrix24-webhook` | externa por design | assinatura/secret de integração |
| `evolution-bitrix-connector` | externa por design | 16 refs de secret; conector |
| `sequence-track` | possivelmente pixel público | endpoint público de tracking |
| `auto-rebatch-behavioral` | INCONCLUSIVO (cron externo) | valida `x-cron-key` |
| `health-aggregate` | INCONCLUSIVO (monitor/uptime) | índices nomeiam suas queries; endpoint público |

**Auxiliar — mantida (sem perda funcional):**

| Edge | Veredito | Evidência |
| --- | --- | --- |
| `win-loss-record-deal` | CONFIRMADO sem chamador, mas `win_loss_records` tem escritor alternativo (upsert `useWinLoss`) | não remover sem decisão de negócio |

**CONFIRMADAS mortas (candidatas a remoção — decisão de negócio):**

| Edge | Veredito | Evidência |
| --- | --- | --- |
| `enrich-contacts` | CONFIRMADO morta | 10/10 testes da auditoria; sem produtor exclusivo |
| `conversation-coaching-digest` | CONFIRMADO morta | usa `withAuth`, não escreve nada; sem chamador |
| `detect-new-device` | CONFIRMADO sem chamador | escreve tabelas sem leitor; endpoint público (verificar antes de remover) |

**Regra de remoção:** nada é apagado sem certeza absoluta (byte a byte) do destino
do chamador. `enrich-contacts` e `conversation-coaching-digest` são as únicas com
morte provada de ponta a ponta; remoção fica **como decisão de negócio** (risco:
existir cron externo que as chame).

## Regras de negócio — fonte

- `docs/contexto/regras/` (gerado automaticamente; não possui `manual/` —
  nenhuma regra humana registrada até 2026-11-13).

## Pendências registradas nesta rodada

1. **Persistência de insights de IA** — GAP FECHADO na #288 (edge
   `generate-insights` passou a gravar na tabela `insights`; antes só retornava
   o JSON ao front e perdia no refresh). Validar em produção.
2. **Baseline idempotente do preview** — #287 aberta (DDL, regra 8) para
   destravar o Supabase Preview pós-restauração das 607 migrations.
3. **15 edges órfãs** — auditar chamadores externos (webhooks/crons) antes de
   remover ou documentar como mortas.
4. **Alerts dependabot (2 moderados, dev-deps)** — minimatch (via
   glob/eslint-plugin-sonarjs) e postcss-selector-parser (via
   @tailwindcss/typography). Fix exige major-bump de build-time; sem impacto
   em runtime.
5. **`src/pages/admin/Observability.tsx`** — página sem rota (código morto ou
   rota faltante).