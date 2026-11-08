# Fatia A — Documentos da raiz + memória Lovable (.lovable/plan.md + 98 arquivos de .lovable/memory) + .devin/.windsurf

**Repo:** /home/user/Singu_V2 · **HEAD:** e616c20 (2026-10-11) · **Modo:** somente leitura (nenhum arquivo do repo foi alterado).

**Método:** cada afirmação dos documentos foi cruzada por grep/leitura em `src/`, `supabase/functions/` (108 funções + `_shared`), `supabase/migrations/` (447 arquivos), `.github/`, `tests/`, `scripts/`. "Ligado" = tela → hook → RPC/tabela/edge function → gatilho/cron. Como não há `node_modules` local, os gates de execução foram conferidos no **log real do CI do HEAD** (`gh run view 38158572871`, run de push em e616c20, conclusão `success`): 91 arquivos / **5.602 testes unitários passando**, cobertura **9,51% statements**, Playwright 69 passados / 29 pulados, gate RLS "20 OK, 0 pulado(s), 0 falha(s)", `rls-coverage.sql` "RLS coverage 100% em public.*", bundle de entrada 343,6 KB.

**Fatos de base usados em vários itens (evidência única, citada por referência):**

- **[B1] Jobs pg_cron versionados (17 no total):** 15 só executam SQL (todos com função-alvo existente) e 2 chamam Edge Function por HTTP. `validation-queue-drain` (`supabase/migrations/20260417120721_823eaa43-...sql:14-21`) aponta para o projeto `rqodmqosrotmtrjnnjul`, mas o `config.toml:1` declara `hjhthvzwtvwgdrochcam`. `smart-notify-automation` (`20260512105729_9e0ffd45-...sql:6-14`) também está versionado. **Nenhum dos dois envia `x-cron-secret`.**
- **[B2] Guarda de cron:** `requireCronSecret` (`supabase/functions/_shared/auth.ts:237-248`) devolve 401 se faltar `x-cron-secret`. 24 funções usam essa guarda (cron-gated). Só 2 delas têm agendador versionado (as de [B1]), e as duas recebem 401.
- **[B3] O front chama 14 funções cron-gated com o JWT do usuário e sem o header** (nenhuma ocorrência de `x-cron-secret` em `src/`), e por isso todas respondem 401:
  - `check-health-alerts` (`src/hooks/useHealthAlerts.ts:195`)
  - `generate-behavioral-profile` (`src/hooks/useBehavioralProfile.ts:66`)
  - `nurturing-runner` (`src/hooks/useNurturingExecutions.ts:54`)
  - `process-webhook-dlq` (`src/hooks/useWebhookDlq.ts:44,59`)
  - `retry-behavioral-profile` (`src/pages/admin/BehavioralRegenAudit.tsx:150`)
  - `revops-snapshot-builder` (`src/hooks/useRevOps.ts:193`)
  - `send-sms-campaign` (`src/hooks/useSmsCampaigns.ts:106`)
  - `sequence-processor` (`src/hooks/useSequenceProcessor.ts:9`)
  - `smart-notify` (`src/hooks/useSmartNotifications.ts:159`)
  - `social-events-detector` (`src/hooks/useEdgeFunctionActions.ts:44`)
  - `sync-social-interests` (`src/hooks/commercial/useSocialSync.ts:69`)
  - `template-success-notifications` (`src/hooks/useTemplateNotifications.ts:102`)
  - `validation-queue-worker` (`src/hooks/useValidationQueue.ts:46`)
  - `weekly-digest` (`src/hooks/useWeeklyReport.ts:169,198`)
- **[B4]** `supabase/config.toml` tem uma única linha (`project_id`). **Nenhum bloco `[functions.*] verify_jwt = false`** aparece no repositório em nenhum dos commits do histórico que tocaram o arquivo.

---

## .lovable/plan.md

**OK verificados (6):**
- `tracedLogger` em `check-notifications/index.ts:8`, `generate-insights/index.ts:17` e `check-health-alerts/index.ts:101`.
- Trigger `contacts_increment_version` (`20260420163323_...sql:17-21`), testado em `tests/rls/admin.sql:27`. O front envia `version` em `Contatos.tsx:234` e `Empresas.tsx:161`.
- Zero `: any` em `src/lib/externalData.ts` e `src/hooks/useContacts.ts`.
- `GlobalSyncIndicator` montado em `src/app/AppChrome.tsx:4`.
- RLS 100%: passo `rls-coverage` do CI do HEAD sem lacunas (0 rows).
- Orçamento de bundle aplicado no CI (`.github/workflows/ci.yml:138`): entrada com 343,6 KB.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| PLAN-01 | "Estado atual: 10/10 sustentado" e "Testes: 5.416 verdes" | .lovable/plan.md:1,17 | 📄 DOC FALSO/DESATUALIZADO | O CI do HEAD tem 5.602 testes passando, mas a cobertura é de 9,51% statements (log do run 38158572871). Esta fatia levanta mais de 60 lacunas funcionais. | Atualizar o plano com cobertura real e lacunas abertas. Definir meta de cobertura com threshold no `vitest.config.ts` (hoje não há nenhum). | Gestão acredita em "10/10" com 90% do código sem teste e módulos inteiros sem gatilho. | P |
| PLAN-02 | "SLO: 99.5% monitorado em /admin/error-budget" | .lovable/plan.md:20 | 🟨 PARCIAL | Rota `src/app/AppRoutes.tsx:176` e função `error-budget` existem. O único gravador de `system_health_snapshots` é `system-health/index.ts:182-191`, chamado só por `/status` (`StatusPage.tsx:49`) e pelo widget `SystemHealthWidget.tsx:67`, que **não está montado** em lugar nenhum. Não há cron (ver MEM-F09). | Agendar `system-health` a cada 5 min (com service role) e o cleanup semanal. | O uptime/SLO é calculado sobre amostras de quem abriu `/status`, não sobre medição contínua. O número não tem validade. | P |
| PLAN-03 | "Supabase linter: 0 CRITICAL, 0 HIGH — WARN documentados" | .lovable/plan.md:18 | 🔌 DESCONECTADO | `scripts/check-backend-linter-baseline.mjs:19-23` sai com 0 quando não recebe stdin, e não é chamado em `.github/workflows/ci.yml`. | Rodar `supabase inspect db linter` no CI e enviar a saída ao script. | Regressão de segurança no banco passa sem alarme. | P |
| PLAN-04 | "TypeScript: 0 erros (tsgo --noEmit)" | .lovable/plan.md:16 | 🟨 PARCIAL | O CI usa `npx tsc --noEmit` (`ci.yml:70`) e não `tsgo`. `tsconfig.app.json:17` tem `"strict": false` e também `noImplicitAny`/`strictNullChecks` em false. | Ligar `strictNullChecks` e depois `strict` de forma incremental. | "0 erros" só vale com a checagem de tipos afrouxada. Bugs de null/undefined chegam à produção. | G |

## .lovable/memory/index.md

**OK verificados (3):**
- RBAC por `user_roles` + `has_role()` (usado nas policies).
- Todas as 108 edge functions usam `Deno.serve` e CORS (exceção: `evolution-bitrix-connector` sem CORS).
- Gate a11y no CI via `vitest-axe` (`src/test/a11y/critical-components.test.tsx:3`), executado em `npm run test:coverage` (`ci.yml:114`).

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| IDX-01 | "Max 400 linhas por arquivo. Sem `any`" | .lovable/memory/index.md:5 (repetido em ARCHITECTURE.md:95 e CONTRIBUTING.md:123,157) | 📄 DOC FALSO/DESATUALIZADO | 91 arquivos de `src/` passam de 400 linhas, por exemplo `src/components/interactions/insights/ObjectionExamplesModal.tsx` (967), `InteracoesPresetsMenu.tsx` (926) e `src/pages/admin/BehavioralRegenAudit.tsx` (826). | Criar regra ESLint `max-lines` com ratchet, ou retirar a regra do documento. | Manutenção cara. Regra "obrigatória" sem enforcement. | M |
| IDX-02 | "Não implementar módulos de Produtos nem Propostas (escopo proibido)" | .lovable/memory/index.md:9; ARCHITECTURE.md:123-126 | 🚫 FORA DE ESCOPO DELIBERADO | Não há rota de Produtos/Propostas em `src/app/AppRoutes.tsx`. **Código residual somente leitura (ERP):** `src/components/contact-detail/commercial-tab/ProposalsCard.tsx`, `src/components/erp/CompanyErpProposalsWidget.tsx`, `src/hooks/useContactProposals.ts`, `src/pages/ErpViewer.tsx`, a edge function `visual-search` (busca de **produto** por imagem, `supabase/functions/visual-search/index.ts:37,151`) e o RPC `search_products_semantic` (`src/hooks/useSemanticSearch.ts`). | Nenhuma ação de construção. Decidir se `visual-search` e `search_products_semantic` ficam no ar (há custo de IA em escopo proibido). | Sem impacto funcional. Possível custo de IA em escopo vetado. | P |

## .lovable/memory/features/*.md (57 arquivos)

**OK verificados (51 conjuntos tela→hook→backend):**

*Assistentes, painéis e inteligência*
- ai-conversational-assistant: `useAiAssistant.ts:32`, `/assistente`, `ai-assistant` com 20 msgs.
- audit-trail: página, `AuditDiffViewer` e export.
- best-time-heatmap: `IntelligenceTab.tsx:113`.
- channel-performance-matrix: `IntelligenceTab.tsx:127`.
- inbound-activity-heatmap: `IntelligenceTab.tsx:116`.
- touchpoint-sequence-analysis: `TouchpointSequenceCard` em `IntelligenceTab.tsx:10`.
- churn-risk: `ChurnRiskPanel` lazy em `ContactIntelligenceTab.tsx:26`, mutation `detect-churn-risk`.
- contact-intelligence-hooks: cinco hooks montados em widgets. O backend é externo, ver NV-01.
- conversation-intelligence: `conversation-analyzer` chamado em `ContactInteractionsTab.tsx:120`, card em `:337`.
- intelligence-hub: 57 componentes, hooks e libs existem e estão montados, exceto PATH (MEM-F12).
- next-best-action: card em `ContactDetailHeader.tsx:16`.
- unified-notifications-center: `UnifiedNotificationsBell` em `Header.tsx:121`.

*Enriquecimento e e-mail*
- bulk-revalidation-flow: UI `Enrichment.tsx:64` e função `bulk-revalidate`. A drenagem da fila está quebrada, ver MEM-F26.
- email-builder-visual: em `Campanhas.tsx` e `LandingPages.tsx`.
- email-finder-apply: Finder → Dialog → `EmailsCard` → `ContactDataTab`.
- email-pipeline-monitoring: página `/admin/email-diagnostics`.

*Admin, conexões e observabilidade*
- connections-module: 5 abas, `connection-tester`, `incoming-webhook`, `mcp-server` com 8 tools filtradas por `ownerUserId` (`mcp-server/index.ts:49-122`).
- error-budget: página, função e `UptimeSparkline`.
- knowledge-export: 22 seções.
- lux-webhook-configuration: `lux_webhook_config`, fallback de env em `lux-trigger/index.ts:117`.
- rpc-plan-snapshots/diff: cron `capture-degraded-rpc-plans`, `RpcPlanSnapshotsCard` em `ErrorBudget.tsx:15`, `get_rpc_plan_diff`.
- system-health-check: função e página `/status`.
- voice-ai-diagnostics: `voice-ai-health`, `VoiceAITestPanel`.

*Vendas, marketing e CS*
- custom-reports-engine: `/relatorios-customizaveis` com localStorage, como documentado.
- customer-success: UI e RPCs `compute_account_health`/`cs_renewal_pipeline` reconcedidas em `20261006130000_frontend_rpcs_authenticated.sql`.
- forecasting: UI, `forecast-analyzer`, `forecast-narrative` e trigger de histórico (`20260417001337_...sql:167`).
- intent-data: pixel, tracker, aggregator manual e `/intent/setup`.
- landing-pages: `/lp/:slug`. A RPC `increment_landing_page_view` só passou a existir em `20261006120000_least_privilege_canonical.sql:242`.
- rodízio novo: 4 crons `singu-rodizio-*` (`20260924213115_...sql:39-42`).
- lead-score-threshold: `lead-scorer` invoca o runner (`lead-scorer/index.ts:157`).
- lead-scoring: `/lead-scoring/config`.
- marketing: forms, magnets e attribution em `MarketingHub.tsx`.
- nps-csat: `/nps`.
- nps-public-survey: `/survey/:token` via `get_public_csat_survey`.
- revops: UI e RPCs.
- playbooks: hub, generator e recommender.
- sms-marketing: UI e templates.
- validation-queue: crons SQL `revalidate-stale-*`.
- win-loss: UI e `win-loss-analyzer`.

*Rodadas de UX e qualidade*
- Rodada A: onboarding de 7 marcos, View Transitions, densidade global, `WhyScoreDrawer`.
- Rodadas B/C: `GlobalCommandBar` (`AppLayout.tsx:264`), `/inbox`, `BulkActionsBar` e `SavedViewsBar` com share por URL.
- Rodada D: skeletons, `useActionToast`, optimistic `useMoveDeal`.
- Rodada E: undo de tarefa (`useReopenTask`) e `check-bundle-size` no CI.
- Rodada F: `attachQueryErrorReporter` (`queryClient.ts:30`) e smoke E2E.
- Rodada G: undo real (`Contatos.tsx`/`Empresas.tsx` com `useRestoreEntity`) e CI.
- Rodada H: Component Gallery, atalhos e ADR-011.
- Rodada I: teste axe e registry de atalhos.
- Rodada K: métricas P95 e triggers que alimentam `smart_notifications` (sino em `Header.tsx:120`).
- Rodada L: HMAC agora obrigatório (`incoming-webhook/index.ts:181-202`), quotas e dry-run.
- Rodada M: introspect, templates, snippets e MCP v1.2.0.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| MEM-F01 | Quick Action "Limpar Cache" | features/admin-dashboard-hub.md:8 | 🎭 VITRINE | `src/components/admin/AdminQuickActions.tsx:36-39` só faz `window.location.reload()`. Não limpa o cache do QueryClient nem do Service Worker. | Chamar `queryClient.clear()`, limpar `caches` e SW, e recarregar. | Admin acha que limpou o cache e o problema persiste. | P |
| MEM-F02 | Quick Action "Rodar Testes" | features/admin-dashboard-hub.md:8 | 🎭 VITRINE | `AdminQuickActions.tsx:65-95` faz só 3 pings (health, `profiles`, `external-data`) e mostra o toast "X/3 testes passaram". | Renomear para "Smoke check" ou ligar a uma suíte real (ex.: workflow sintético). | Falsa sensação de validação. | P |
| MEM-F03 | Status cards do hub (Sistema/Integrações) | features/admin-dashboard-hub.md:7; technical/system-health-monitoring.md:12 | 🎭 VITRINE | `src/pages/AdminDashboard.tsx:108` usa a função **legada** `health` (a doc diz "deprecated — usar system-health"). O card "Integrações — WhatsApp, Email, Voice AI" exibe `dbStatus` (`checks.database`, do banco local) em `AdminDashboard.tsx:148-152,190-195`. | Trocar para `system-health` e mapear `whatsapp`/`email_pipeline`/`voice_ai`. | Integração fora do ar aparece como "Saudável". | P |
| MEM-F04 | Edge Function `audit-analytics` (top entidades, ops/hora 30d) | features/audit-trail-viewer.md:10 | 🔌 DESCONECTADO | A função existe (`supabase/functions/audit-analytics/index.ts:11`), mas há 0 chamadas em `src/`. | Criar cards analíticos em `/admin/audit-trail` consumindo a função. | Compliance sem visão agregada de alterações. | P |
| MEM-F05 | `cs-health-recalc` "cron 05:00 UTC" com alertas de queda | features/customer-success-suite.md:20 | 🔌 DESCONECTADO | A função é cron-gated (`cs-health-recalc/index.ts:7`), não tem job versionado [B1] e tem 0 chamadas no front. | Agendar com `x-cron-secret` (pg_cron + pg_net + Vault). | Health score de contas não é recalculado. Queda e risco de churn não alertam. | P |
| MEM-F06 | Campanhas de e-mail "Materializar & Enviar" | features/email-campaigns-detail-send.md:7,11,13 | 🎭 VITRINE | `src/hooks/useEmailCampaigns.ts:118-136` grava `campaign_recipients.status='sent'` e `sent_at` e marca a campanha como `sent`. **Nenhuma edge function envia e-mail** (0 refs a `campaign_recipients`/`email_campaigns` em `supabase/functions`, nenhum provedor SMTP/Resend). | Criar um worker de envio (provedor + rastreio de abertura/clique) e só marcar `sent` quando houver confirmação. | Usuário acredita que a campanha saiu. Nenhum e-mail chega e as métricas ficam zeradas. | G |
| MEM-F07 | Validação automática do e-mail aplicado pelo Finder | features/email-finder-apply-to-contact.md:16 | 📄 DOC FALSO/DESATUALIZADO | O trigger `trg_enqueue_contact_validation` está em `public.contacts` (`20260417120525_...sql:78`). O e-mail é gravado na tabela **externa** `contact_emails` via `insertExternalData`, onde o trigger não existe. | Enfileirar a validação explicitamente em `useApplyFoundEmail`. | E-mails encontrados entram sem verificação (risco de bounce). | P |
| MEM-F08 | Widget `EmailPipelineStatus` para dashboards admin | features/email-pipeline-monitoring.md:11 | 🔌 DESCONECTADO | Definido em `src/components/admin/EmailPipelineStatus.tsx:30` e sem nenhum importador. | Montar no `AdminDashboard` ou remover. | Baixo. Status de e-mail só visível na página dedicada. | P |
| MEM-F09 | Crons `system-health-snapshot-5min` e `system-health-snapshots-cleanup`. Alertas automáticos 50/75/100% | features/error-budget-dashboard.md:7-9 | 🔌 DESCONECTADO | Nenhuma ocorrência desses jobnames em `supabase/migrations` [B1]. Os snapshots só são gravados quando alguém abre `/status` (`system-health/index.ts:182-191`). Os alertas de budget só são avaliados quando um admin abre a página. | Versionar os 2 jobs (o de snapshot chamando `system-health` com service role). | SLO 99,5% e alertas de budget não refletem a realidade (ver PLAN-02). | P |
| MEM-F10 | `forecast-snapshot-cron` (snapshots diários) | features/forecasting-revenue-intelligence.md:3,18 | 🔌 DESCONECTADO | Função cron-gated (`forecast-snapshot-cron/index.ts:8,51`) sem agendador [B1] e com 0 chamadas no front. O `AccuracyChart` (`src/pages/Forecasting.tsx:11`) lê `forecast_snapshots`. | Agendar o job diário com `x-cron-secret`. | Gráfico de acurácia/tendência do forecast fica vazio. Não há histórico para cobrar previsão. | P |
| MEM-F11 | Fechar período de forecast (`useClosePeriod`) | features/forecasting-revenue-intelligence.md:27 | 🟨 PARCIAL | O hook existe (`src/hooks/useForecasting.ts:119`) mas não tem consumidor em nenhuma tela. | Adicionar a ação "Fechar período" em `/forecasting`. | Períodos ficam abertos e o `actual_won_amount` não é consolidado. | P |
| MEM-F12 | Intelligence Hub — PATH "BFS shortest-path" (`src/lib/graphPath.ts`) | features/intelligence-hub.md:3,42,45 | 🎭 VITRINE | `graphPath.ts` não existe. `src/components/intelligence/GraphTab.tsx:233-256` só lista os 2 bookmarks com "→" e o rótulo "BFS · share via URL". Nenhum caminho é calculado nem destacado. | Implementar BFS sobre os nós e arestas do grafo e destacar o caminho. | Recurso anunciado não entrega análise de conexão entre entidades. | M |
| MEM-F13 | Widget `IntentSignalCard` em ContatoDetalhe/EmpresaDetalhe | features/intent-data-module.md:25 | 🔌 DESCONECTADO | Definido em `src/components/intent/IntentSignalCard.tsx:13`, com 0 importadores. | Montar nas abas de contato e empresa. | Vendedor não vê intenção de compra no registro que está trabalhando. | P |
| MEM-F14 | Edge Function `lead-routing` (`distribute`/`redistribute`/`reset_daily`) e hooks `useServerDistribute`/`useServerRedistribute`/`useResetDailyCounts` | features/lead-routing-portfolio-rotation.md:20-30,40 | 📄 DOC FALSO/DESATUALIZADO | A função não existe em `supabase/functions/` e os hooks não existem. `src/components/lead-routing/LeadRoutingModule.tsx:62-73` registra que foram "removidos sem equivalente 1:1". O motor novo de rodízio por ondas (`rodizio_*` + 4 crons) está ativo. | Reescrever a memória. Avaliar se a "redistribuição por inatividade N dias" precisa voltar ao motor novo. | Doc orienta para fluxo inexistente. Leads parados não são redistribuídos automaticamente por inatividade. | M |
| MEM-F15 | `lead-score-cron` (enfileira) e fila `lead_score_recompute_queue` drenada automaticamente | features/lead-scoring-server-side.md:3,13,19 | 🔌 DESCONECTADO | O cron é gated (`lead-score-cron/index.ts:10`) e não tem agendador [B1]. O trigger `tg_intent_signals_enqueue_score` só enfileira. A drenagem só acontece no clique "Recalcular todos" (`src/hooks/useLeadScoring.ts:165`, `lead-scorer/index.ts:221`). | Agendar o cron e um job que drene a fila (`lead-scorer` batch). | Score e grade A/B/C/D ficam congelados. Automações de threshold (MEM-F19) não disparam sozinhas. | P |
| MEM-F16 | `LeadScoreCard` server-side (radar + sparkline) como widget do ContatoDetalhe | features/lead-scoring-server-side.md:27,33 | 🔌 DESCONECTADO | `src/components/lead-scoring/LeadScoreCard.tsx:60` não tem importadores. A ficha usa o card **antigo client-side** (`src/components/lead-score/LeadScoreWidget.tsx:5,94` em `ContactIntelligenceTab.tsx:28`). | Trocar o widget da ficha pelo card server-side. | Score mostrado ao vendedor diverge do score oficial usado em `/lead-scoring` e nas automações. | P |
| MEM-F17 | Nurturing runner "cron */5" (`marketing-nurturing-runner`) e MQL evaluator "cron 03:00" (`marketing-mql-evaluator`) | features/marketing-automation-suite.md:3,8 | 🔌 DESCONECTADO | Nenhum dos jobnames está nas migrations [B1]. As duas funções são cron-gated. O botão "Executar" (`src/hooks/useNurturingExecutions.ts:54`) recebe 401 [B3]. `mql-evaluator` tem 0 chamadas no front. | Agendar os 2 jobs com `x-cron-secret` e trocar o botão por RPC ou função com JWT. | Fluxos de nutrição não avançam e leads não viram MQL/SQL automaticamente. | P |
| MEM-F18 | Passos de nurturing do tipo e-mail/WhatsApp | features/marketing-automation-suite.md:8 | 🎭 VITRINE | `supabase/functions/nurturing-runner/index.ts:91-99` só insere uma `interaction` (registro). Nada é enviado. | Integrar o envio real (provedor de e-mail e `evolution-api` `send-message`). | Lead "nutrido" não recebe nenhuma mensagem. | M |
| MEM-F19 | Ação `enroll_sequence` → sequências com envio de e-mail | features/lead-score-threshold-automations.md:17 | 🎭 VITRINE | `supabase/functions/sequence-processor/index.ts:337` invoca `send-transactional-email`, que **não existe** em `supabase/functions/`. O erro é engolido (`:346`) e o log fica `status:'sent'` (`:330`). O processor é cron-gated, sem cron, e o botão do front recebe 401 [B3]. | Criar a função de envio e um agendador. Só marcar `sent` com confirmação. | Cadências "enviadas" nunca chegam ao cliente. Métricas de abertura e resposta são falsas. | M |
| MEM-F20 | `revops-snapshot-builder` "cron 04:00 UTC" com alertas -15%/-30% | features/revops-dashboard.md:3,15 | 🔌 DESCONECTADO | Cron-gated (`revops-snapshot-builder/index.ts:20`) sem agendador [B1]. "Gerar snapshot" (`src/hooks/useRevOps.ts:193`) recebe 401 [B3]. | Agendar com `x-cron-secret` e trocar o botão. | Funil histórico e alertas de queda de conversão nunca são gerados. | P |
| MEM-F21 | `PlaybookSuggestionDrawer` acionável no PipelineKanban/ContatoDetalhe | features/sales-playbooks-battle-cards.md:28 | 🔌 DESCONECTADO | Definido em `src/components/playbooks/PlaybookSuggestionDrawer.tsx:25`, com 0 importadores. `playbook-recommender` só é chamado por ele. | Montar o drawer no Kanban e na ficha. | A recomendação contextual de playbook/battle card não chega ao vendedor. | P |
| MEM-F22 | `seed_playbook_defaults` (4 playbooks + 2 battle cards) | features/sales-playbooks-battle-cards.md:14 | 🔌 DESCONECTADO | Sem chamador em `src/` nem em `supabase/functions`. EXECUTE revogado de PUBLIC/authenticated (`20260924144037_t203_...sql:45`). | Chamar no onboarding via service role, ou reconceder com checagem `auth.uid()`. | Biblioteca nasce vazia para novos usuários. | P |
| MEM-F23 | Envio de campanha SMS via Twilio | features/sms-marketing-module.md:9 | 🔌 DESCONECTADO | `send-sms-campaign/index.ts:27` exige `x-cron-secret`. A UI chama com JWT (`src/hooks/useSmsCampaigns.ts:106`) e recebe 401 [B3]. | Separar a autenticação: JWT do dono para disparo manual, cron para agendado. | Nenhuma campanha SMS pode ser disparada pela tela. | P |
| MEM-F24 | `SystemHealthWidget` no header (admin, auto-refresh 60s) | features/system-health-check.md:8; technical/system-health-monitoring.md:10 | 🔌 DESCONECTADO | `src/components/admin/SystemHealthWidget.tsx:61` não tem importadores (o `Header.tsx` monta só os sinos e o density toggle). | Montar no header para admins. | Admin não vê degradação sem abrir `/status`. Menos snapshots para o SLO. | P |
| MEM-F25 | `TechTooltip` e `VersionBadge` (v2.8.0) | features/technical-documentation-system.md:8,10 | ⬛ MORTO | `src/components/docs/TechTooltip.tsx:26` e `src/components/docs/VersionBadge.tsx:9` não têm uso (só `CodeExample` é usado). | Usar ou remover. | Nenhum. Só ruído de código. | P |
| MEM-F26 | Pipeline automático da fila de validação (cron `validation-queue-drain` */5) e botão "Processar agora" | features/validation-queue-auto-pipeline.md:24-31; features/bulk-revalidation-flow.md:22 | 🔌 DESCONECTADO | O cron chama o projeto `rqodmqosrotmtrjnnjul` (diferente do `config.toml:1`) e sem `x-cron-secret` (`20260417120721_...sql:14-21`). O worker exige o secret (`validation-queue-worker/index.ts:24`). O botão manual (`useValidationQueue.ts:46`) recebe 401. Os crons de revalidação enchem uma fila que nunca drena. | Reescrever o job com a URL do projeto correto e o header vindo do Vault. Trocar o botão por um caminho autenticado. | E-mails e telefones novos ou revalidados nunca são verificados. Bounce e cadastro sujo. | P |
| MEM-F27 | Captura Win/Loss (`WinLossCaptureDialog` "chamável de PipelineKanban") e `win-loss-record-deal` | features/win-loss-intelligence.md:14 | 🔌 DESCONECTADO | `src/components/win-loss/WinLossCaptureDialog.tsx:21` tem 0 importadores. `supabase/functions/win-loss-record-deal/index.ts:61` tem 0 chamadores. Nenhum trigger insere em `win_loss_records`. **Não existe caminho de entrada de dados no módulo.** | Abrir o dialog ao mover um deal para ganho/perdido no Kanban, ou chamar a edge function. | `/win-loss` (win rate, motivos, concorrentes, insights de IA) fica permanentemente vazio. | P |
| MEM-F28 | "Seed 18 motivos padrão" (`seed_win_loss_defaults`) em `/win-loss/setup` | features/win-loss-intelligence.md:7,13 | 🔌 DESCONECTADO | O front chama a RPC com o JWT do usuário (`src/hooks/useWinLoss.ts:224`), mas EXECUTE foi revogado de authenticated/PUBLIC (`20260723103825_...sql:72`; `20260924144037_t203_...sql:46`) e não foi reconcedido (ausente em `20261006130000_frontend_rpcs_authenticated.sql`). | Reconceder EXECUTE com guarda `auth.uid() = _user_id` (como já foi feito com `seed_forecast_period`). | O botão de seed falha (42501). O catálogo de motivos nasce vazio. | P |
| MEM-F29 | `conversation-coaching-digest` (narrativa executiva de coaching) | features/conversation-intelligence.md:17 | 🔌 DESCONECTADO | A função existe em `supabase/functions/conversation-coaching-digest/`, com 0 chamadas em `src/`. | Adicionar "Gerar digest" na aba Coaching de `/conversation-intelligence`. | Gestor não recebe resumo de coaching. | P |
| MEM-F30 | "verify_jwt=false em config.toml" para funções públicas (conversation-intel, intent-tracker, win-loss, system-health) | features/conversation-intelligence.md:15; features/intent-data-module.md:15; features/win-loss-intelligence.md:18; technical/system-health-monitoring.md:6 | 📄 DOC FALSO/DESATUALIZADO | Ver [B4]: `config.toml` só tem `project_id`. Um deploy pela CLI com este config exigiria JWT no gateway para pixel, form, webhooks, `/status`, deal room e assinatura. | Versionar `[functions.<nome>] verify_jwt=false` para os endpoints públicos. | Num redeploy ou DR, as páginas públicas, o pixel e os webhooks param (401). O estado atual depende de flag manual (NÃO VERIFICADO). | P |
| MEM-F31 | "Workspace Modes" (Rodada C) | features/ux-rodada-a-quick-wins.md:51 | ❌ NÃO INICIADO | 0 ocorrências de `WorkspaceMode`/`workspace-mode` em `src/`. A Rodada D (`ux-rodada-d-polimento.md:15`) declara "A+B+C+D = 20/20". | Especificar e implementar, ou retirar do roadmap. | Promessa de UX por perfil não entregue. | M |
| MEM-F32 | "Daily Briefing IA ao login" (Rodada B) | features/ux-rodada-a-quick-wins.md:49 | 🟨 PARCIAL | `src/components/dashboard/DailyBriefingCard.tsx:1-10` é heurística local (life events e contagens), sem IA nem edge function. Está montado em `src/pages/Index.tsx:108`. | Ligar a `generate-insights` ou `ask-crm` para gerar o briefing com IA. | Briefing genérico, sem priorização inteligente. | M |
| MEM-F33 | Memória `mem://standards/performance-budget` | features/ux-rodada-e-confiabilidade.md:12 | 📄 DOC FALSO/DESATUALIZADO | `.lovable/memory/standards/` só contém `accessibility-wcag-aa.md`. | Criar a memória ou corrigir a referência. | Baixo. | P |
| MEM-F34 | RUM Web Vitals → `error_logs` e painel `/admin/error-logs` | features/ux-rodada-g-observabilidade.md:16-19; features/ux-rodada-f-hardening.md:15 | 🎭 VITRINE | `src/lib/errorReporting.ts:114-115` lê `VITE_SUPABASE_ANON_KEY`, que **não existe** (o `.env.example:16` define `VITE_SUPABASE_PUBLISHABLE_KEY`; 0 outras ocorrências). O flush retorna sem enviar. Além disso, posta com a chave anon e a policy exige `auth.uid()` (`20260926200322_...sql:53`). | Usar a sessão do usuário (supabase client) com a env correta. | Nenhum erro ou métrica de performance de produção é persistido. O painel de erros fica sempre vazio. | P |
| MEM-F35 | Edge Function `health-aggregate` (v3.1.0, bloco `connections`) para status público | features/ux-rodada-i-polimento-profundo.md:9; features/ux-rodada-k-observabilidade-integracoes.md:27 | 🔌 DESCONECTADO | `supabase/functions/health-aggregate/index.ts:180-211` existe, com 0 chamadas em `src/`. O `/status` usa `system-health` (`StatusPage.tsx:49`). | Unificar `/status` em uma só função ou remover a duplicada. | Saúde de conexões e webhooks fica fora da status page. | P |
| MEM-F36 | DLQ de webhooks com cron "*/5 min, jobid 10" e botões "Reprocessar agora/lote" | features/ux-rodada-k-observabilidade-integracoes.md:11-13 | 🔌 DESCONECTADO | Não há job no repo [B1]. `process-webhook-dlq/index.ts:27` exige o secret. Os botões (`src/hooks/useWebhookDlq.ts:44,59`) recebem 401 [B3]. | Agendar o job e criar um caminho admin autenticado. | Webhooks que falharam nunca são reprocessados. Perda silenciosa de leads e eventos. | P |
| MEM-F37 | Self-healing por schema drift (`incoming-webhook` → `ai-suggest-mapping` → `smart_notification` canal `mapping_drift`) | features/ux-rodada-n-ia-self-healing.md:11; CHANGELOG.md:108 | ❌ NÃO INICIADO | 0 ocorrências de `mapping_drift` no repo. `incoming-webhook/index.ts` não chama `ai-suggest-mapping` (o erro só cai na DLQ, `:332`). | Implementar o disparo em background e a notificação para aceite humano. | Mudança de payload do parceiro quebra a integração sem aviso proativo. | M |
| MEM-F38 | Detector de anomalias de conexões "diário" | features/ux-rodada-n-ia-self-healing.md:10; index.md:30 | 🔌 DESCONECTADO | `connection-anomaly-detector` só roda manualmente (`src/hooks/useConnectionAnomalies.ts:73`). Não há cron [B1]. | Agendar o job diário. | Picos de erro e queda de volume só são vistos se alguém clicar em "scan". | P |
| MEM-F39 | Ask CRM / "chat sobre conexões" (`ask-crm` com whitelist e exigência de admin) | features/ux-rodada-n-ia-self-healing.md:12; index.md:30 | 🎭 VITRINE | `supabase/functions/ask-crm/index.ts:174-181` executa `execute_readonly_query` com o client **service role**. A versão vigente da RPC (`20260723123359_...sql:62-67`) exige `auth.uid()` não nulo e `has_role(admin)`, o que dá RAISE sempre. O ask-crm devolve só a explicação da IA com `data: null` (`:183-189`). A validação do SQL é por regex (`:125-159`). | Executar com o JWT do usuário (INVOKER e RLS) por um parser ou allowlist de tabelas, e remover o uso de service role. | O chat flutuante (`AskCrmChat` em `AppLayout`) e a aba Ask do Intelligence Hub nunca trazem dados reais. | M |

## .lovable/memory/architecture/*.md (4) + standards (1) + technical (1)

**OK verificados (5):**
- edge-functions/security: os "próximos candidatos" já têm rate limit (83 funções usam `rateLimit(`).
- provider-hierarchy: `assertProviderOrder` (`src/app/AppProviders.tsx:40`), `ProviderErrorBoundary` e `src/test/providers.test.ts`.
- secret-rotation: `/admin/secrets-management` com registro manual, como documentado.
- accessibility-wcag-aa: `SkipNav` (`AppProviders.tsx:64`), `RouteAnnouncer` e `AriaLiveRegion`.
- system-health-monitoring: a função existe (o widget é tratado em MEM-F24).

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| MEM-A01 | HOC `withProviderCheck` e `scripts/lint-providers.cjs` "para pre-commit hooks" | architecture/provider-hierarchy-and-context.md:8-9 | ⬛ MORTO | `src/components/hoc/withProviderCheck.tsx:23` não tem uso. `lint-providers.cjs` não aparece em `package.json`, no CI nem em hook (não há `.husky/`). | Plugar no CI ou remover. | Baixo. | P |
| MEM-A02 | "Ratchet enforçado por `check-backend-linter-baseline.mjs` (BASELINE=12)" e "novo CRITICAL/HIGH bloqueia deploy" | architecture/security/linter-baseline.md:9,57; migration/completion-32-10.md:33 | 🔌 DESCONECTADO | Ver PLAN-03: o script não roda no CI e é no-op sem stdin (`scripts/check-backend-linter-baseline.mjs:19-23`). Não há pipeline de deploy para "bloquear". | Adicionar um job no CI com a saída do linter. | Política de segurança só no papel. | P |

## .lovable/memory/migration/*.md (36: 29 completions + 7 singu_source)

**OK verificados (36):**
- 149 de 150 arquivos citados nas completions existem. A exceção é `/tmp/apply-disables.mjs` em `completion-30-10.md:31`, temporário por natureza.
- Passos de CI prometidos e presentes: `invalid-indexes-guard` (`ci.yml:60-67`), `rls-coverage` (`ci.yml:128-135`), CORS enforcer (`ci.yml:31-32`) e ESLint `--max-warnings=0` nos 4 escopos (`ci.yml:77-81`).
- O débito de `ALTER DEFAULT PRIVILEGES` para anon foi resolvido em `20261006120000_least_privilege_canonical.sql:58-66`.
- As 114 tabelas de `singu_source_tables.md` existem nas migrations.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| MEM-M01 | "full-audit.sh = 28 FATAL + 38 WARN = 66 checks" | migration/completion-25-10.md:18 | 📄 DOC FALSO/DESATUALIZADO | `scripts/migration/verify/full-audit.sh:14-80` tem **26 FATAL + 37 WARN = 63**. | Corrigir a contagem ou incluir os 3 guards faltantes. | Baixo. Auditoria superestimada. | P |
| MEM-M02 | Bateria `full-audit.sh` e guards standalone "via cron externo" | migration/completion-16-10.md:23; completion-19-10.md:20; completion-20-10.md:19 | 🔌 DESCONECTADO | `full-audit.sh` não é chamado em `.github/workflows/*`. Nenhum cron versionado roda os guards. | Criar um workflow agendado (GitHub Actions `schedule`) contra o banco canônico. | 63 guards de saúde do Postgres existem e nunca rodam sozinhos. | M |
| MEM-M03 | Observabilidade externa: exporter Prometheus, SLO burn-rate, Alertmanager (PagerDuty/Slack) | migration/completion-26-10.md:14-22; index.md:18 | 🟨 PARCIAL | Os arquivos de regra existem e são validados (`.github/workflows/monitoring-lint.yml`). Porém `monitoring/alertmanager/alertmanager.yml:31,38,44` tem `REPLACE_ME`/`REPLACE_ME_PD_INTEGRATION_KEY`. O exporter depende de "cron externo" não versionado. Os alertas `RpcPlan*`/`RpcPerf*` ficam em `scripts/monitoring/rpc-perf-alerts.yml`, fora do `promtool` do CI (`monitoring-lint.yml:23`). | Provisionar Prometheus/Alertmanager com credenciais reais, agendar exporters e mover as regras para `monitoring/prometheus/rules`. | Nenhum alerta chega a um humano (pager/Slack). | M |
| MEM-M04 | Rodada 46/10: `REVOKE ALL FROM authenticated` em 50+ tabelas "service-role-only" | migration/completion-46-10.md:18-27 | 📄 DOC FALSO/DESATUALIZADO | A migration ainda está na cadeia (`20260723150429_...sql:18-95`) e revoga tabelas lidas pelo front: `validation_queue`, `incoming_webhooks`, `incoming_webhook_logs`, `incoming_webhook_dlq`, `audit_log`, `error_logs`, `system_alerts`, `system_health_snapshots`, `connection_anomalies`, `lead_score_threshold_log`, `nurturing_executions`, `attribution_touchpoints`, `secret_rotation_log`, `query_telemetry`, `schema_drift_alerts`, `sequence_events`, `playbook_usage_log`, `connection_test_logs`, `lead_score_history`. Exemplos de leitura: `useValidationQueue.ts:26`, `useIncomingWebhooks.ts`, `AdminAuditTrail.tsx:70`, `useErrorLogs.ts`, `useSecretRotation.ts:42`. Nenhum re-GRANT posterior. A fixture que valida isso foi reduzida a `cron_secrets` (`tests/rls/authenticated_least_privilege.sql:30`), sinal de que o banco remoto diverge da cadeia. | Criar uma migration de reconciliação que reconceda SELECT (via RLS admin/dono) nessas tabelas, ou ajustar a lista. Atualizar a memória. | Num ambiente recriado a partir das migrations (DR/staging), cerca de 20 telas admin e de módulos quebram com 42501. Estado remoto NÃO VERIFICADO. | M |
| MEM-M05 | "Guardrails de IA (budget) — implementação SQL fica para migração dedicada quando budget for definido" | migration/completion-11-10.md:18-19 | ❌ NÃO INICIADO | `20261006140000_ai_gateway_observability.sql` cria métricas e alertas de saúde, mas não tem nenhum controle de budget, quota ou corte de custo de IA (0 ocorrências de budget/quota/guardrail). | Teto por usuário/dia e corte automático no gateway. | Custo de IA sem teto (mais de 20 funções chamam LLM). | M |
| MEM-M06 | Backlog "Onda C": trocar `Math.random()` por `crypto`; 101 `no-orphans` do dep-cruiser | migration/completion-28-10.md:45-47 | 🟨 PARCIAL | 49 `Math.random()` em `src/` fora de testes. O CI ainda emite `warn no-orphans` (ex.: `src/data/triggerBundles.ts`). | Concluir a troca onde houver uso sensível e limpar os órfãos. | Baixo. Código órfão aumenta o custo de manutenção. | P |
| MEM-M07 | "Secrets scan" / "CI monitoring-lint (secret-scan)" | migration/completion-12-10.md:14; index.md:18,42 | ❌ NÃO INICIADO (não cobre o vazamento real) | `scripts/migration/functions/secrets-leak-scan.sh:18-27` não tem padrão `sbp_`. `monitoring-lint.yml:41-48` só varre `scripts/migration/verify/exporter/`. Um PAT da Supabase Management API está commitado em 11 arquivos (ver HER-01). | Gitleaks/trufflehog em todo o repo no CI. Rotacionar o PAT. | Token com poder de admin sobre o banco canônico exposto no repositório. | P |

---

## README.md

**OK verificados (17):**
- Os 13 módulos da tabela `README.md:16-30` existem e estão montados: Empresas/Contatos, Interações, DISC, PNL, Neuro, Carnegie (11 painéis em `src/components/carnegie/`), Stakeholder, Lux, RFM, Alertas, `/network`, `/mapa-empresas` e Dashboard.
- `GET /functions/v1/health` (`README.md:142`).
- Gate RLS `tests/rls/run.sh` (`README.md:129`).
- `MFAGuard` (`src/app/AppRoutes.tsx:33`).
- `useWebVitals` (`README.md:143`).

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| README-01 | "31 Edge Functions", "~50 migrations", "4.470 testes" | README.md:105,108,151 | 📄 DOC FALSO/DESATUALIZADO | 108 funções em `supabase/functions/`, 447 migrations, 5.602 testes (CI do HEAD). | Atualizar os números (ou gerá-los automaticamente). | Onboarding com visão errada do tamanho do sistema. | P |
| README-02 | "Relatório Completo (PDF): audit_report.pdf" | README.md:84 | 📄 DOC FALSO/DESATUALIZADO | `audit_report.pdf` não existe no repo. | Gerar o PDF ou remover o link. | Baixo. | P |
| README-03 | Integração Evolution API (WhatsApp) para envio e conexão | README.md:44; HANDOFF.md:27,152-154 | 🔌 DESCONECTADO | `supabase/functions/evolution-api/index.ts:26-27,114-148` implementa `connect-instance` (QR), `send-message`, `send-media` e outras, mas há **0 chamadas em `src/`**. Só a entrada (`evolution-webhook`) está ligada. | Tela de instâncias com QR e reconexão, e botão "Enviar WhatsApp" na ficha/inbox. | O CRM não envia WhatsApp nem permite reconectar a instância. O troubleshooting do HANDOFF manda usar uma tela inexistente. | M |
| README-04 | Push notifications (PWA) | FUNCIONALIDADES_SISTEMA.md:399-402; CHANGELOG.md:304 | 🎭 VITRINE | `supabase/functions/send-push-notification/index.ts:44-52` faz POST do JSON **em texto puro** com `Content-Encoding: aes128gcm`, sem assinatura VAPID nem criptografia RFC 8291. A chave pública em `src/lib/pushNotifications.ts:4-6` é declarada como "placeholder". | Usar a lib web-push (VAPID e criptografia) e gerar o par de chaves real. | O usuário assina o push mas nunca recebe notificação (alertas de saúde e templates). | M |

## FUNCIONALIDADES_SISTEMA.md

**OK verificados (50):**
- DISC: 6 de 6 componentes montados (`DiscSubTab.tsx` e `Analytics.tsx`).
- PNL: 18 de 18 montados (`NLPAnalytics.tsx` e `Analytics.tsx`).
- Neuro: NeuroScore, Radar, Timeline, AB, Heatmap e Training montados.
- Copywriting: `/crm/copywriting`.
- Lux com polling.
- RFM: `rfm-analyzer` grava `rfm_analysis`.
- Alertas: `alerts`, `compatibility_*` e `health_*` com UI.
- Insights.
- GlobalSearch e presets.
- QuickAdd, NotificationCenter e OnboardingTour (`AppLayout.tsx`).
- `useFormDraft`.
- Favoritos.
- `external-data`.
- Dashboard.
- 31 tabelas citadas existem nas migrations e nos types.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| FUNC-01 | Frameworks de personalidade (Big Five, MBTI, Enneagram, Temperamento) | FUNCIONALIDADES_SISTEMA.md:48-52; AUDITORIA_SISTEMA.md:24-25 | 🟨 PARCIAL | Os hooks de análise automática (`useBigFiveAnalysis`, `useMBTIAnalysis`, `useEnneagramAnalysis`, `useTemperamentAnalysis`) e os cards não existem. Só há o formulário de preenchimento manual em `src/components/contact-detail/behavioral-tab/PersonalitySubTab.tsx:31-46`. | Inferência automática (LLM) a partir de interações, como já ocorre no DISC. | Perfis ficam vazios. Ninguém preenche à mão. | M |
| FUNC-02 | Inteligência Emocional, Valores do Cliente, Objeções Ocultas, Critérios de Decisão, Análise Temporal e Métricas de Conversão DISC | FUNCIONALIDADES_SISTEMA.md:73-77,127-131,252-301 | 🎭 VITRINE | As telas leem as tabelas, mas **nenhum produtor existe** (front, edge, trigger ou cron):<br>• `eq_analysis_history` (`ContactBehavioralTab.tsx:78`)<br>• `client_values` (`crm/commercial/ClientValuesElite.tsx:32`)<br>• `hidden_objections` (`ContactIntelligenceTab.tsx:64`)<br>• `decision_criteria` (`crm/commercial/DecisionCriteriaElite.tsx:41`)<br>• `contact_time_analysis` (`useContactTimeAnalysis.ts:27`)<br>• `disc_conversion_metrics` (`useDISCConversionMetrics.ts:18`) | Criar os geradores (IA por interação e agregações por cron). Dados legados: NÃO VERIFICADO. | Cards e painéis de inteligência aparecem sempre vazios ou estáticos. | G |
| FUNC-03 | Configuração de perfil DISC (`disc_profile_config`) | FUNCIONALIDADES_SISTEMA.md:115-120 | ⬛ MORTO | Só aparece na allowlist `supabase/functions/external-data/index.ts:116`. Nenhuma tela ou hook lê. | Usar como fonte das estratégias DISC (hoje hardcoded em `src/data/discAdvancedData.ts`) ou remover. | Baixo. | P |
| FUNC-04 | NeuroAlerts, Pain-Claim-Gain Builder e tratamento de objeções por sistema cerebral | FUNCIONALIDADES_SISTEMA.md:175,178,181; AUDITORIA_SISTEMA.md:80,83,86 | ⬛ MORTO | `src/components/neuromarketing/NeuroAlerts.tsx`, `PainClaimGainBuilder.tsx:417` e `NeuroObjectionHandler.tsx:124` são exportados no barrel e não são importados por nenhuma página (`Analytics.tsx:46-50` não os inclui). | Montar em `/analytics` ou na ficha, ou remover. | Ferramentas de argumentação vendidas e invisíveis. | P |
| FUNC-05 | Feature Spotlight (descoberta de funcionalidades) | FUNCIONALIDADES_SISTEMA.md:377 | ⬛ MORTO | `src/components/feedback/FeatureSpotlight.tsx:25` não tem uso. | Montar ou remover. | Baixo. | P |
| FUNC-06 | `useSidebarState` (sidebar colapsável) | FUNCIONALIDADES_SISTEMA.md:366; AUDITORIA_SISTEMA.md:165 | 📄 DOC FALSO/DESATUALIZADO | O hook não existe em `src/`. O estado de UI está em `src/stores/useUIStore.ts`. | Corrigir o doc. | Nenhum. | P |

## FIELD_MAPPING.md

**OK verificados (13):**
- `mapCompany()`/`extractLocationFromName()` em `src/hooks/useCompanies.ts:72-140`, com todos os campos fiscais e cooperativos.
- 12 views e tabelas externas (`vw_singu_*`, `vw_companies_completo`, `mv_daily_kpis`, `company_*`, `workspace_accounts`, `nps_surveys`) com hook e widget montados, por exemplo `OverviewTab`, `Analytics.tsx` e `ContactBehavioralTab`.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| FM-01 | "Os contatos são armazenados diretamente no Supabase local" | FIELD_MAPPING.md:81 | 📄 DOC FALSO/DESATUALIZADO | `src/hooks/useContacts.ts:105-106,192-193` lê `contacts` via `queryExternalData` (proxy externo). | Atualizar o mapeamento de contatos (email/phone vêm de `contact_emails`/`contact_phones`). | Dev de manutenção altera a tabela errada. | P |
| FM-02 | 15 RPCs documentadas como disponíveis | FIELD_MAPPING.md:130-221 | 🔌 DESCONECTADO | Estão na allowlist (`supabase/functions/external-data/index.ts:20-101`) e não têm consumidor no front: `get_executive_dashboard`, `get_mini_dashboard`, `get_seller_dashboard`, `search_contacts`, `search_contacts_advanced`, `search_contacts_fuzzy`, `list_contacts_paginated`, `get_contact_360_by_phone`, `get_contact_disc_profile`, `get_company_health_score`, `advanced_company_search`, `get_deals_pipeline`, `move_deal_to_stage`, `predict_close_date`, `assign_territory`. | Ligar as relevantes (dashboard executivo/vendedor, previsão de fechamento, atribuição de território) ou tirar da allowlist. | Recursos de backend pagos e sem tela (ex.: previsão de fechamento, health score de empresa). | M |
| FM-03 | Defaults `financial_health='unknown'` e `status='ativo'` | FIELD_MAPPING.md:27,50 | 📄 DOC FALSO/DESATUALIZADO | O código usa `?? null` (`src/hooks/useCompanies.ts`, bloco `mapCompany`). | Alinhar doc e código. | Baixo. Filtros por "unknown/ativo" perdem registros nulos. | P |

## HANDOFF.md

**OK verificados (13):**
- 5 rotas core e 7 rotas admin (`HANDOFF.md:37-70`) existem em `AppRoutes.tsx`.
- Hierarquia de providers (`HANDOFF.md:78-81`) aplicada em `AppProviders.tsx`.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| HO-01 | "Edge Functions: 30 · Tabelas: 40+" (documento de handoff) | HANDOFF.md:4 | 📄 DOC FALSO/DESATUALIZADO | 108 funções e 274 tabelas criadas nas migrations. | Regenerar o handoff (o `/admin/knowledge-export` é estático, com 22 seções hardcoded). | Handoff para novo time subdimensiona o sistema em cerca de 4x. | P |
| HO-02 | "WhatsApp não envia → Reconectar via QR Code na página de WhatsApp" | HANDOFF.md:152-154 | 🔌 DESCONECTADO | `/whatsapp` só redireciona para `/interacoes?canal=whatsapp` (`AppRoutes.tsx:153`). Não há tela de QR (ver README-03). | Tela de instância Evolution. | Operação não consegue restabelecer o WhatsApp sem acesso técnico. | M |
| HO-03 | "Integração com WhatsApp, Email e **VoIP**"; Proxycurl para scraping social | HANDOFF.md:10,127 | 📄 DOC FALSO/DESATUALIZADO | 0 código de VoIP/SIP (só o registro de chamadas via `bitrix24-webhook`). 0 ocorrências de `PROXYCURL` em `supabase/functions`: o `social-profile-scraper` usa Firecrawl. | Corrigir o doc ou implementar a discagem VoIP. | Expectativa comercial de telefonia integrada não atendida. | P |

## CHANGELOG.md

**OK verificados (25):**
- Unreleased: `vercel.json` (SPA e headers), `20261008120000_fix_frontend_rpcs_canonical.sql`, `20261011120000_rpc_plan_structural_hash.sql`, `20261011120100_restrict_title_case_helper.sql`, `20261007100000_external_rpc_user_scope.sql`.
- 2.7.4: lock otimista ponta a ponta.
- 2.7.3: tracing e split da sidebar.
- 2.7.1: Lighthouse CI.
- 2.6.0–2.2.0: connections, com exceção de CL-01/CL-02.
- 2.1.0: axe e registry.
- 1.x: Google OAuth (`src/pages/Auth.tsx:198`), PWA, Leaflet, Lux, RFM, insights, Weekly Digest e Smart Reminders existem (gatilhos em CL-04).

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| CL-01 | "Cron `process-webhook-dlq-every-5min` (jobid 10)" | CHANGELOG.md:154 | 🔌 DESCONECTADO | Ver MEM-F36 (não há job em `supabase/migrations`). | Ver MEM-F36. | Ver MEM-F36. | P |
| CL-02 | "Self-healing por schema drift… canal `mapping_drift`" | CHANGELOG.md:108 | ❌ NÃO INICIADO | Ver MEM-F37. | Ver MEM-F37. | Ver MEM-F37. | M |
| CL-03 | Versionamento SemVer (2.0.0…2.7.4; badge v2.8.0) com `[Unreleased]` acumulando 14 itens | CHANGELOG.md:6,8-29,31 | 📄 DOC FALSO/DESATUALIZADO | `package.json:4` tem `"version": "0.0.0"`. `git tag` está vazio. | Versionar `package.json`, criar tags e fechar o release das mudanças Unreleased. | Sem rastreabilidade de release nem rollback por versão. | P |
| CL-04 | "Weekly Digest (relatório semanal **automatizado**)" e "Smart Reminders com sugestão inteligente" | CHANGELOG.md:293,303 | 🔌 DESCONECTADO | `weekly-digest` é cron-gated, sem agendador, e o envio manual (`useWeeklyReport.ts:169,198`) recebe 401 [B3]. `smart-notify` tem cron de 4h sem `x-cron-secret` (`20260512105729_...sql:6-14`) e por isso recebe 401 [B1]. | Agendar com secret e criar um caminho manual autenticado. | Gestores não recebem digest semanal. Lembretes inteligentes não disparam. | P |
| CL-05 | 1.9.0 "Eliminado 100% dos `any`" vs 2.7.2 "248 `: any` restantes" | CHANGELOG.md:227,76 | 📄 DOC FALSO/DESATUALIZADO | Hoje há 5 ocorrências fora de testes e a regra está como `error` (`eslint.config.js:27`). O histórico é contraditório. | Nota de correção no changelog. | Baixo. | P |

## ARCHITECTURE.md (raiz)

**OK verificados (5):**
- Proxy único `external-data`.
- RLS e `has_role` SECURITY DEFINER.
- Circuit breaker e `resilientFetch` (usado em `src/integrations/supabase/client.ts`).
- Google OAuth.
- Módulos proibidos (ver IDX-02).

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| ARQ-01 | "Nova Interação (>100 chars) → Edge Functions paralelas `analyze-interaction` (DISC), `analyze-sentiment` (IE), `detect-cognitive-biases`" | ARCHITECTURE.md:68-74 | 📄 DOC FALSO/DESATUALIZADO | Nenhuma das 3 funções existe em `supabase/functions/`. O DISC usa `disc-analyzer` (`useDISCAutoAnalysis` em `DiscSubTab.tsx`). O NLP é client-side (`useNLPAutoAnalysis` em `useInteractions.ts`). Não há análise de IE automática (FUNC-02). | Atualizar o diagrama e o fluxo e decidir sobre o gerador de IE e vieses. | Arquitetura documentada não corresponde ao runtime. A análise emocional prometida não roda. | P |
| ARQ-02 | "Leaflet 4.2.1 (pinned)" e "Zustand (sidebar)" | ARCHITECTURE.md:16,21 | 📄 DOC FALSO/DESATUALIZADO | `package.json:75,88`: `leaflet ^1.9.4` (4.2.1 é o `react-leaflet`). O Zustand é usado em 5 stores de simulação e UI. | Corrigir o doc. | Nenhum. | P |

## AUDITORIA_SISTEMA.md (2026-03-15)

**OK verificados (0 adicionais):** os módulos já foram contados em FUNCIONALIDADES.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| AUDS-01 | "100% das funcionalidades documentadas estão implementadas" | AUDITORIA_SISTEMA.md:7,145 | 📄 DOC FALSO/DESATUALIZADO | **20 arquivos citados não existem mais:**<br>• Frameworks: `BigFiveProfileCard`, `MBTIProfileCard`, `EnneagramProfileCard`, `TemperamentProfileCard`, `useBigFiveAnalysis`, `useMBTIAnalysis`, `useEnneagramAnalysis`, `useTemperamentAnalysis`<br>• Persistência: `useEQPersistence`, `useHiddenObjectionsPersistence`, `useClientValuesPersistence`, `useContactPreferences`<br>• Ofertas e vendas: `PersonalizedOffersPanel`, `usePersonalizedOffers`, `useSalesScript`, `usePersuasionScore`<br>• Outros: `SearchSuggestions`, `useSidebarState`, `SatisfactionScorePanel`/`useSatisfactionScore`, `useNegotiationSimulator`<br>**6 arquivos existem sem uso:** `NeuroAlerts`, `PainClaimGainBuilder`, `NeuroObjectionHandler`, `CognitiveBiasesPanel`, `ClientHealthPanel`, `InteractionCardMemo`. | Marcar o documento como histórico e reauditar. | Decisão tomada sobre "100%" que não existe. Satisfação, simulador de negociação e frameworks prometidos sumiram. | P |
| AUDS-02 | Tabela "Edge Functions — todas configuradas: config.toml ✅" (25 funções) | AUDITORIA_SISTEMA.md:66-96 | 📄 DOC FALSO/DESATUALIZADO | Ver [B4]: o `config.toml` não tem nenhum bloco `[functions.*]`. | Ver MEM-F30. | Ver MEM-F30. | P |

## AUDITORIA_COMPLETA_SISTEMA.md (2026-07-19, plano de remediação em 50 etapas)

**OK verificados (17 etapas já corrigidas no HEAD):**
1. SSRF: `connection-tester/index.ts:5,40-83`.
2. MCP isolado por `ownerUserId`.
3. `evolution-webhook` com `requireWebhookSecret`.
4. `lux-webhook` com `requireWebhookSecret`.
5. `bitrix24-webhook` com `requireWebhookSecret`.
6. Rate limit em `form-submit-handler` (`:5`).
7. Comparação timing-safe (`_shared/auth.ts:28`).
8. 0 CORS wildcard.
9. `resilientFetch` usado.
10. PWA sem autodestruição (`src/main.tsx:28`).
11. Rate limit em 83 funções.
12. Cache do `useContacts` com páginas (`:234-238`).
13. `demand-forecast` (`:17-19`).
14. ilike escapado no MCP (`:43`).
15. HMAC via `crypto.subtle`.
16. Dependabot (`.github/dependabot.yml`).
17. Retenção diária (`apply-data-retention-daily`) e consentimento (`ConsentAuditLog`).

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| AUDC-01 | Etapa 9: "Substituir validação por keywords por parser SQL real no ask-crm" | AUDITORIA_COMPLETA_SISTEMA.md:54-59,327 | 🟨 PARCIAL | Ainda por regex (`ask-crm/index.ts:125-159`), e quebrado na execução (ver MEM-F39). | Ver MEM-F39. | Risco de exfiltração e recurso inoperante. | M |
| AUDC-02 | Etapas 25-26: habilitar `strictNullChecks` e `noImplicitAny` | AUDITORIA_COMPLETA_SISTEMA.md:110-115,353-354 | ❌ NÃO INICIADO | `tsconfig.app.json:17` e seguintes: `strict`, `noImplicitAny` e `strictNullChecks` estão em `false`. | Ver PLAN-04. | Bugs de null/undefined em produção. | G |
| AUDC-03 | Etapas 27-30 e 34: testes de edge functions e execução no CI | AUDITORIA_COMPLETA_SISTEMA.md:117-122,356-363 | 🟨 PARCIAL | Existem 16 arquivos `*_test.ts` em `supabase/functions`, mas `.github/workflows/*.yml` não roda `deno test`. | Job `deno test` no CI cobrindo `_shared/auth`, webhooks, `mcp-server` e `ask-crm`. | Regressões de segurança no backend passam sem detecção. | M |
| AUDC-04 | Etapas 35-38: pipeline de deploy via CLI, staging, gates de aprovação e migrations no CI | AUDITORIA_COMPLETA_SISTEMA.md:124-129,369-372 | ❌ NÃO INICIADO | `ci.yml` não tem nenhum passo de deploy nem de staging. As migrations são aplicadas "via MCP em produção" (`20260924142818_t201_...sql:3`). | Workflow de deploy (functions e migrations) com ambiente de staging. | Deploy manual e irreprodutível. Drift entre repo e produção (ver MEM-M04 e MEM-F30). | G |
| AUDC-05 | Etapa 12: VAPID e criptografia no push | AUDITORIA_COMPLETA_SISTEMA.md:180-185,331 | ❌ NÃO INICIADO | Ver README-04. | Ver README-04. | Push inoperante. | M |
| AUDC-06 | Etapa 4: CAPTCHA/honeypot no `form-submit-handler` | AUDITORIA_COMPLETA_SISTEMA.md:94,318 | 🟨 PARCIAL | Só tem rate limit de 5/min (`form-submit-handler/index.ts:5`). Sem CAPTCHA e sem honeypot. | Turnstile/hCaptcha ou honeypot. | Formulários públicos sujeitos a spam de leads. | P |
| AUDC-07 | Etapa 13: reduzir uso de service_role nas edge functions | AUDITORIA_COMPLETA_SISTEMA.md:159-164,332 | 🟨 PARCIAL | 82 funções ainda leem `SUPABASE_SERVICE_ROLE_KEY`. A melhoria fica no `external-data` com JWT (`20261007100000_external_rpc_user_scope.sql`). | Auditoria por função e troca para o client do usuário. | Qualquer bug vira vazamento cross-tenant. | G |
| AUDC-08 | Etapa 14: CSP | AUDITORIA_COMPLETA_SISTEMA.md:333 | 🟨 PARCIAL | `index.html:9` tem CSP com `'unsafe-inline'` em `script-src`. O `vercel.json:12` só tem `frame-ancestors`, `object-src` e `base-uri`. | CSP com nonce/hash e sem `unsafe-inline` em script. | Mitigação de XSS fraca. | M |
| AUDC-09 | Etapa 17: Sentry/Bugsnag para erros de produção | AUDITORIA_COMPLETA_SISTEMA.md:131-136,341 | ❌ NÃO INICIADO | Nenhuma dependência ou integração Sentry em `package.json`. O reporter interno não envia (ver MEM-F34). | Ver MEM-F34 e integrar um APM. | Zero visibilidade de erro em produção. | P |
| AUDC-10 | Etapa 32: memoizar o valor do AuthContext | AUDITORIA_COMPLETA_SISTEMA.md:274,361 | ❌ NÃO INICIADO | `src/hooks/useAuth.tsx:290` passa `value={{ ... }}` literal, sem `useMemo`. | Aplicar `useMemo`/`useCallback`. | Re-renders globais e lentidão em telas pesadas. | P |
| AUDC-11 | Etapa 42: source maps de produção | AUDITORIA_COMPLETA_SISTEMA.md:376 | ❌ NÃO INICIADO | `vite.config.ts:81` tem `sourcemap: false`. | Gerar `hidden` source maps e enviá-los ao APM. | Stack traces de produção ilegíveis. | P |
| AUDC-12 | Etapa 49: consolidar migrations (squash) | AUDITORIA_COMPLETA_SISTEMA.md:388 | ❌ NÃO INICIADO | 447 migrations, inclusive revogações conflitantes (ver MEM-M04). | Baseline squash validada contra o canônico. | Recriar o ambiente é lento e arriscado (DR). | M |
| AUDC-13 | Etapa 41: paralelizar o CI | AUDITORIA_COMPLETA_SISTEMA.md:375 | ❌ NÃO INICIADO | `ci.yml:10` tem um único job `build-and-test` sequencial (cerca de 15 min no run do HEAD). | Separar em jobs paralelos. | Feedback lento a cada PR. | P |

## audit_report.md (2026-05-14)

**OK verificados (2):**
- Módulos core da tabela 2.1.
- "Global Search AI (Beta)": `semantic-search`/`conversational-search` ligados em `src/components/search/GlobalSearch.tsx` via `useSemanticSearch.ts:94` e `useConversationalSearch.ts:206`.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| AR-01 | "Auto-Testes — Backlog — Cobertura > 70% em lógica core" | audit_report.md:52 | ❌ NÃO INICIADO | Cobertura de 9,51% statements no CI do HEAD. Não há `thresholds` em `vitest.config.ts`. | Threshold progressivo de cobertura no CI. | Regressões de negócio (RFM, DISC, pipeline) não são detectadas. | G |
| AR-02 | "BI Avançado — Dashboards customizáveis via Drag & Drop" | audit_report.md:53 | ❌ NÃO INICIADO | Não há lib de drag & drop em `package.json` nem handlers de drag em `src/pages/BIAvancado.tsx`/`ReportBuilder.tsx`. | Grid de widgets arrastáveis com persistência. | Usuário não monta o próprio painel. | M |
| AR-03 | Evidências do inventário (NeuroScore em `components/analytics`, `AdminErrorLogs.tsx`, "100 EFs, 106 rotas") | audit_report.md:19-20,42,81 | 📄 DOC FALSO/DESATUALIZADO | NeuroScore fica em `src/components/neuromarketing/NeuroScore.tsx`. A página é `src/pages/admin/ErrorLogs.tsx`. São 108 funções e 109 rotas. | Corrigir as referências. | Baixo. | P |

## CONTRIBUTING.md

**OK verificados (2):**
- Commitlint de títulos de PR (`ci.yml:24-26`).
- Conventional Commits.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| CT-01 | "Post-mortem obrigatório em `docs/incidents/`" e "`mem://standards/code-quality-and-engineering-standards`" | CONTRIBUTING.md:141,152 | 📄 DOC FALSO/DESATUALIZADO | `docs/incidents/` não existe. `.lovable/memory/standards/` só tem `accessibility-wcag-aa.md`. | Criar a pasta e a memória, ou corrigir as referências. | Processo de incidentes sem lugar definido. | P |
| CT-02 | "Status checks obrigatórios… CI 100% (Lint, Typecheck, Testes, Build, Lighthouse)" | CONTRIBUTING.md:50 | 🟨 PARCIAL | O Lighthouse roda (`ci.yml:140-141`), mas o log do HEAD mostra só "⚠️ best-practices warning" sem falhar. Os testes de edge functions não rodam (ver AUDC-03). | Tornar as asserções do Lighthouse `error` e incluir `deno test`. | Gate "100%" com lacunas. | P |

## .hermes.md / tmp_view_check.js

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| HER-01 | "GitHub: nunca commitar segredos" | .hermes.md:27; CONTRIBUTING.md:168 | ❌ NÃO INICIADO (regra violada) | **PAT da Supabase Management API (`sbp_5bf0…`, redigido) hardcoded** em `tmp_view_check.js:2` (ref. `pgxfvjmuubtbowutlide`, `:3`) e em mais 10 scripts: `scripts/apply-all.js:5`, `apply-functions.js`, `apply-migrations.js`, `apply-missing.js`, `apply-remaining.js`, `apply-rls.js`, `apply-triggers-views.js`, `chunk-apply.js`, `fix-enums.js`, `retry-failed.js`. JWT anon de outro projeto em `supabase/migrations/20260417120721_...sql:19`. | **Rotacionar o PAT imediatamente**, limpar o histórico ou mover para env, e adicionar gitleaks no CI (ver MEM-M07). | Quem lê o repo tem SQL de administrador no banco de produção. | P |
| TMP-01 | `tmp_view_check.js` (diagnóstico ad-hoc de colunas `interactions`/`contacts`) | tmp_view_check.js:1-37 | ⬛ MORTO | Não é referenciado por `package.json`, CI ou scripts. Só serve de veículo do segredo. | Remover do repo. | Baixo (exceto pelo segredo de HER-01). | P |

## .devin/skills/graphify + .windsurf/rules/graphify.md

**OK verificados (2):**
- `graphify-out/` com `graph.json`, `GRAPH_REPORT.md` e `graph.html`, versão pinada 0.9.67 (`.devin/skills/graphify/.graphify_version`).
- Scripts `graphify:*` em `package.json:9-11`.

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| GR-01 | "Após modificar código, rodar `graphify update .` para manter o grafo atual" | .windsurf/rules/graphify.md:9 | 🟨 PARCIAL | `graphify-out/GRAPH_REPORT.md:14` diz "Built from commit `b2443cd0`", commit que **não existe** no histórico (`git cat-file` falha). Não há atualização automática (CI/hook). A `graphify-out/wiki/index.md` citada não existe. | Gerar o grafo no CI a partir do HEAD, ou registrar o SHA correto. | Agentes de IA consultam um grafo possivelmente defasado. | P |

---

## Itens transversais (afetam vários documentos)

| ID | Funcionalidade/plano | Origem (doc:linha) | Status HEAD | Evidência atual (arquivo:linha) | O que falta (concreto) | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|---|
| X-01 | Toda a camada de automação agendada (crons diários/5 min prometidos em forecasting, CS, RevOps, marketing, lead scoring, DLQ, error budget, validação, digest, social, behavioral regen) | features/*.md (MEM-F05/09/10/15/17/20/26/36/38), CHANGELOG.md:154,303 | 🔌 DESCONECTADO | [B1][B2]: 22 de 24 funções cron-gated não têm agendador versionado. As 2 com agendador recebem 401 por falta de `x-cron-secret`, e uma aponta para outro projeto Supabase. | Migration única com `cron.schedule` + `net.http_post` lendo URL e secret do Vault, para as 24 funções. Monitorar com `cron.job_run_details`. | O "CRM que trabalha sozinho" não trabalha: nada roda sem clique humano. | M |
| X-02 | Botões manuais "Processar/Executar/Gerar/Enviar/Reprocessar" | ver [B3] | 🔌 DESCONECTADO | 14 chamadas do front a funções cron-gated recebem 401 [B3]. | Separar a autenticação (`withAuthOrServiceRole` com checagem de dono/admin) nas funções acionadas pelo usuário. | Funcionalidades manuais de SMS, DLQ, RevOps, digest, sequências e regen comportamental falham com erro genérico. | M |

---

## Itens NÃO VERIFICADOS (dependem do banco/infra remotos)

| ID | Afirmação | Origem | Por que não foi possível confirmar |
|---|---|---|---|
| NV-01 | Cerca de 42 RPCs consumidas pelo front via `external-data`. Exemplos: `get_contact_intelligence`, `get_best_contact_time`, `get_duplicate_contacts`, `get_birthday_contacts`, `get_orphan_contacts`, `get_complete_dashboard`, `get_weighted_forecast`, `get_cohort_analysis`, `get_leaderboard`, `get_territories`. | FIELD_MAPPING.md:123-221; features/contact-intelligence-hooks.md:8-14 | Não estão definidas em `supabase/migrations/` (vivem no banco externo `EXTERNAL_SUPABASE_URL`). O CHANGELOG.md:19 diz "177 RPCs compilam no canônico", mas não dá para auditar pelo repo. |
| NV-02 | Pipeline de e-mail Google Workspace → Pub/Sub → Webhook → `email_logs` | HANDOFF.md:29,90-94; features/email-pipeline-monitoring.md:3 | Nenhuma função de ingestão Gmail/Pub/Sub no repo. Só o monitor `email-pipeline-health` lê `email_logs` externo. |
| NV-03 | Branch protection (1 aprovação, checks obrigatórios, histórico linear) | CONTRIBUTING.md:44-52 | Configuração do GitHub não consultada. |
| NV-04 | "Mobile audit" (Rodada C) | features/ux-rodada-a-quick-wins.md:52 | Sem artefato no repo. |
| NV-05 | Supabase linter "12 WARN (piso)" e "0 CRITICAL/HIGH" | architecture/security/linter-baseline.md:7; plan.md:18 | Requer `supabase inspect db linter` no remoto (ver PLAN-03). |
| NV-06 | Flags `verify_jwt` reais das funções públicas no deploy atual | features/*.md (MEM-F30) | Não versionadas [B4]. Só o painel Supabase confirma. |
| NV-07 | Prometheus, Alertmanager e exporters realmente implantados | migration/completion-26-10.md | Config com placeholders (ver MEM-M03). Não há manifesto de deploy. |
| NV-08 | Dados legados nas tabelas comportamentais sem produtor (`eq_analysis_history`, `client_values` etc.) | FUNCIONALIDADES_SISTEMA.md:252-301 | Pode haver carga histórica de migração. Não há produtor contínuo (ver FUNC-02). |
| NV-09 | Estado real dos GRANTs de authenticated nas 50+ tabelas da Rodada 46 | migration/completion-46-10.md | A cadeia de migrations revoga. A fixture do gate foi reduzida a `cron_secrets`. Só uma consulta `has_table_privilege` no canônico confirma (ver MEM-M04). |

---

## Resumo numérico

- **Documentos e arquivos analisados:** 12 da raiz (`README`, `FUNCIONALIDADES_SISTEMA`, `FIELD_MAPPING`, `HANDOFF`, `CHANGELOG`, `ARCHITECTURE`, `AUDITORIA_SISTEMA`, `AUDITORIA_COMPLETA_SISTEMA`, `audit_report`, `CONTRIBUTING`, `.hermes.md`, `tmp_view_check.js`), mais `.lovable/plan.md`, os 98 arquivos de `.lovable/memory/` e os 3 arquivos de `.devin/.windsurf`.
- **Itens verificados:** 353.
  - **OK (100% ligados):** 247.
  - **Lacunas:** 97, todas tabeladas acima.
  - **Não verificados:** 9.

| Documento | OK |
|---|---|
| plan.md | 6 |
| memory/index.md | 3 |
| memory/features | 51 |
| memory/architecture + standards + technical | 5 |
| memory/migration | 36 |
| README.md | 17 |
| FUNCIONALIDADES_SISTEMA.md | 50 |
| FIELD_MAPPING.md | 13 |
| HANDOFF.md | 13 |
| CHANGELOG.md | 25 |
| ARCHITECTURE.md | 5 |
| AUDITORIA_COMPLETA_SISTEMA.md | 17 |
| audit_report.md | 2 |
| CONTRIBUTING.md | 2 |
| .devin + .windsurf | 2 |
| **Total** | **247** |

**Lacunas por status (97 linhas únicas):**

| Status | Qtd |
|---|---|
| 🔌 DESCONECTADO | 30 |
| 📄 DOC FALSO/DESATUALIZADO | 22 |
| ❌ NÃO INICIADO | 14 |
| 🟨 PARCIAL | 13 |
| 🎭 VITRINE | 11 |
| ⬛ MORTO | 6 |
| 🚫 FORA DE ESCOPO DELIBERADO | 1 |

As tabelas têm 102 linhas. 5 delas são só referências cruzadas e não entram na contagem: CL-01→MEM-F36, CL-02→MEM-F37, AUDC-01→MEM-F39, AUDC-05→README-04 e AUDS-02→MEM-F30.

**Por esforço (97 linhas únicas):** P = 66, M = 24, G = 7.

---

## Top 10 lacunas de maior impacto

1. **X-01 / X-02 — a automação agendada inteira está desligada.** 22 de 24 funções cron-gated não têm cron. As 2 que têm recebem 401 (sem `x-cron-secret`; uma aponta para outro projeto). 14 botões manuais também recebem 401. Isso afeta forecast, CS, RevOps, nurturing, MQL, lead score, DLQ, validação, digest e SMS. Evidência: [B1][B2][B3].
2. **HER-01 / MEM-M07 — PAT da Supabase Management API commitado** em `tmp_view_check.js:2` e em mais 10 scripts. O secrets scan não detecta. Exige rotação imediata.
3. **MEM-F06 / MEM-F19 / MEM-F18 — envio de e-mail é "vitrine".** Campanhas marcam `sent` sem enviar (`useEmailCampaigns.ts:118-136`). Sequências chamam a função inexistente `send-transactional-email` (`sequence-processor/index.ts:337`). O nurturing só registra uma interação.
4. **MEM-F39 — Ask CRM (chat flutuante e aba Ask) nunca retorna dados.** O `ask-crm` usa service role para chamar `execute_readonly_query`, que exige `auth.uid()` e admin (`20260723123359_...sql:62-67`). A validação do SQL continua por regex.
5. **MEM-F27 / MEM-F28 — Win/Loss sem nenhuma porta de entrada.** O dialog de captura não está montado e a edge function não tem chamador. O seed de motivos recebe 42501 (RPC revogada).
6. **MEM-F34 / AUDC-09 — telemetria de erros e Web Vitals nunca persiste.** `VITE_SUPABASE_ANON_KEY` não existe (`errorReporting.ts:114`). O `/admin/error-logs` fica vazio e não há APM.
7. **PLAN-02 / MEM-F09 — o "SLO 99,5%" não é medido.** Não há cron de snapshot. O uptime vem só de visitas a `/status`, porque o `SystemHealthWidget` está desmontado.
8. **README-03 / HO-02 / README-04 — canais de saída inexistentes.** O WhatsApp não envia nem reconecta (a `evolution-api` não tem chamador). O push PWA não tem VAPID nem criptografia.
9. **MEM-M04 / MEM-F30 / AUDC-04 — reprodutibilidade de ambiente comprometida.** A cadeia de migrations revoga do authenticated o acesso a mais de 20 tabelas que o front lê. O `config.toml` não versiona `verify_jwt` dos endpoints públicos. Não há pipeline de deploy nem staging. Um DR ou redeploy quebraria telas, webhooks e páginas públicas.
10. **FUNC-02 / FUNC-01 — inteligência comportamental "oca".** IE, valores, objeções ocultas, critérios de decisão, análise temporal e conversão DISC são lidos sem nenhum produtor. Big Five, MBTI e Eneagrama são só formulário manual. Isso afeta o diferencial central do produto ("Sistema de Inteligência Relacional").
