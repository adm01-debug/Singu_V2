# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado em `docs/contexto/codigo/` na branch `contexto` (gerada, nunca abra PR dela) a cada push em `main` e a cada 10 minutos pelo workflow `contexto.yml`; índice único das três fontes em `docs/contexto/00-INDEX.md`. Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `682ad793f5080f5ef81b3771a3e469518a49faed` (2026-11-18T11:52:26-03:00).

## Como usar (leia antes de planejar ou executar qualquer tarefa)
1. **Tela/rota/menu** → `rotas.json` (url/vista/menu → arquivo → hooks → tabelas → edges; `rotas_http_backend` para APIs) e `modulos.json` (módulo inteiro + dependências entre módulos).
2. **Hook/serviço/lógica** → `hooks.json`, `logica.json` (quem usa, o que toca, se tem teste).
3. **Edge function / serverless** → `edge-functions.json` (verify_jwt, tabelas, env, quem chama, órfãs).
4. **Banco** → `banco.json` (colunas, RLS, policies, índices, FKs, triggers, cron jobs, buckets, drift migration×types, uso no código) — visão do código; para o banco vivo use o MCP.
5. **Antes de criar arquivo** → `convencoes.json` (onde ficam as coisas, nomenclatura, alias), `componentes.json` (nomes duplicados, órfãos), `grafo.json` (hubs, ciclos de import) e `grafo-graphify.json` (grafo por AST: comunidades, símbolos mais chamados, comunidade de cada arquivo).
6. **CI/scripts/deploy/env/integrações/permissões/flags** → `ferramentas.json` e `scripts.json`.
7. **Antes de abrir PR** → `testes.json` (o que tem e não tem teste, onde os testes ficam), `baseline.json` (alertas, TODOs, hotspots, últimos commits).
Os JSONs são grandes: filtre com `grep`/`jq` pelo caminho/arquivo/tabela da sua tarefa; não carregue tudo.

## Stack
- linguagens: TypeScript (2052), SQL (659), Markdown (156), Shell (147), JavaScript (143), JSON (22), Python (21), YAML (17)
- linguagem_principal: TypeScript
- framework: React
- backend_http: n/d
- bundler: Vite
- roteador: react-router
- banco: Supabase
- testes: vitest, playwright
- ui: tailwind, radix/shadcn
- estado: react-query, zustand
- gerenciador_pacotes: bun
- node: n/d
- python: n/d
- deploy: vercel
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 3241 |
| arquivos_codigo | 2215 |
| linhas_codigo | 414132 |
| rotas | 114 |
| rotas_http_backend | 8 |
| vistas_por_id | 0 |
| itens_menu | 56 |
| modulos | 141 |
| componentes | 1057 |
| hooks | 408 |
| edge_functions | 109 |
| tabelas | 418 |
| migrations | 486 |
| cron_jobs | 34 |
| testes | 268 |
| workflows | 11 |
| scripts | 296 |
| docs_md | 156 |

## Onde ficam as coisas
- telas: src/pages (113)
- componentes: src/components (908), src/pages (140), src/app (4)
- hooks: src/hooks (377), src/components (20), src/stores (5)
- servicos_logica: src/lib (72), src/data (46), src/domain (8)
- testes: co-localizado (*.test) (126), co-localizado (__tests__) (90), tests/ (23)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/migration (177), scripts/maintenance (15), scripts/hardening (10)
- docs: docs (41), (raiz) (17)
- nomenclatura: {"componentes":"PascalCase (93%)","hooks":"use + PascalCase","servicos":"camelCase (89%)","edge_functions":"kebab-case (99%)","tabelas":"snake_case (90%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| app | 0 | 0 | 6 | 638 | 68 | 228 |
| components/abm | 0 | 0 | 8 | 19 | 2 | 6 |
| components/admin | 0 | 0 | 44 | 35 | 12 | 19 |
| components/analytics | 0 | 0 | 42 | 79 | 2 | 26 |
| components/bi | 0 | 0 | 5 | 20 | 2 | 6 |
| components/carnegie | 0 | 0 | 12 | 1 | 0 | 0 |
| components/companies | 0 | 0 | 5 | 7 | 1 | 2 |
| components/company-detail | 0 | 0 | 29 | 66 | 2 | 11 |
| components/contact-detail | 0 | 0 | 110 | 123 | 14 | 75 |
| components/contacts | 0 | 0 | 10 | 15 | 2 | 10 |
| components/conversation-intel | 0 | 0 | 11 | 12 | 1 | 5 |
| components/crm | 0 | 0 | 34 | 17 | 1 | 37 |
| components/customer-success | 0 | 0 | 8 | 14 | 0 | 6 |
| components/dashboard | 0 | 0 | 46 | 100 | 6 | 38 |
| components/deal-rooms | 0 | 0 | 8 | 22 | 3 | 8 |
| components/disc | 0 | 0 | 9 | 5 | 0 | 5 |
| components/enrichment | 0 | 0 | 11 | 25 | 4 | 15 |
| components/feedback | 0 | 0 | 16 | 9 | 0 | 1 |
| components/ficha-360 | 0 | 0 | 36 | 49 | 4 | 14 |
| components/forecasting | 0 | 0 | 9 | 14 | 2 | 5 |
| components/forms | 0 | 0 | 17 | 23 | 3 | 11 |
| components/gamification | 0 | 0 | 5 | 8 | 1 | 2 |
| components/intel | 0 | 0 | 34 | 13 | 1 | 4 |
| components/intelligence | 0 | 0 | 5 | 15 | 2 | 7 |
| components/intent | 0 | 0 | 5 | 11 | 2 | 4 |
| components/interactions | 0 | 0 | 42 | 44 | 3 | 17 |
| components/layout | 0 | 0 | 6 | 307 | 24 | 89 |
| components/lead-routing | 0 | 0 | 6 | 16 | 0 | 10 |
| components/lead-scoring | 0 | 0 | 13 | 17 | 1 | 7 |
| components/lux | 0 | 0 | 6 | 3 | 1 | 3 |
| components/micro-interactions | 0 | 0 | 6 | 0 | 0 | 0 |
| components/navigation | 0 | 0 | 12 | 307 | 24 | 89 |
| components/neuromarketing | 0 | 0 | 17 | 1 | 0 | 0 |
| components/nlp | 0 | 0 | 33 | 10 | 2 | 9 |
| components/onboarding | 0 | 0 | 8 | 5 | 0 | 3 |
| components/pipeline | 0 | 0 | 9 | 14 | 1 | 6 |
| components/playbooks | 0 | 0 | 6 | 14 | 2 | 4 |
| components/revops | 0 | 0 | 5 | 9 | 1 | 4 |
| components/search | 0 | 0 | 12 | 13 | 5 | 7 |
| components/security | 0 | 0 | 9 | 8 | 0 | 5 |
| components/sequences | 0 | 0 | 7 | 8 | 1 | 8 |
| components/skeletons | 0 | 0 | 5 | 0 | 0 | 0 |
| components/stakeholders | 0 | 0 | 10 | 6 | 0 | 3 |
| components/triggers | 0 | 0 | 33 | 12 | 1 | 10 |
| components/ui | 0 | 0 | 72 | 10 | 0 | 2 |
| components/win-loss | 0 | 0 | 8 | 17 | 1 | 5 |
| data | 0 | 0 | 46 | 3 | 0 | 6 |
| domain | 0 | 0 | 8 | 1 | 1 | 2 |
| hooks | 0 | 0 | 375 | 629 | 53 | 206 |
| hooks/voice | 0 | 0 | 9 | 2 | 0 | 1 |
| lib | 0 | 0 | 68 | 16 | 2 | 13 |
| pages | 45 | 105 | 105 | 615 | 66 | 222 |
| pages/admin | 4 | 7 | 9 | 323 | 26 | 96 |
| pages/crm | 1 | 1 | 1 | 0 | 0 | 0 |
| pages/mapa | 0 | 0 | 5 | 5 | 1 | 4 |
| stores | 0 | 0 | 5 | 1 | 0 | 0 |
| types | 0 | 0 | 20 | 0 | 0 | 0 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/Index.tsx (protegida)
- `/*` [tela] → src/pages/NotFound.tsx
- `/abm` [tela] → src/pages/ABM.tsx (protegida)
- `/abm/:id` [tela] → src/pages/ABMAccountDetail.tsx (protegida)
- `/abm/campanhas` [tela] → src/pages/ABMCampaigns.tsx (protegida)
- `/admin` [tela] → src/pages/AdminDashboard.tsx (protegida)
- `/admin/audit-trail` [tela] → src/pages/AdminAuditTrail.tsx (protegida)
- `/admin/behavioral-regen-audit` [tela] → src/pages/admin/BehavioralRegenAudit.tsx (protegida)
- `/admin/component-gallery` [tela] → src/pages/admin/ComponentGallery.tsx (protegida)
- `/admin/conexoes` [tela] → src/pages/AdminConexoes.tsx (protegida)
- `/admin/conexoes/logs` [tela] → src/pages/AdminConexoesLogs.tsx (protegida)
- `/admin/docs` [tela] → src/pages/DocsPage.tsx (protegida)
- `/admin/email-diagnostics` [tela] → src/pages/AdminEmailDiagnostics.tsx (protegida)
- `/admin/error-budget` [tela] → src/pages/admin/ErrorBudget.tsx (protegida)
- `/admin/error-logs` [tela] → src/pages/admin/ErrorLogs.tsx (protegida)
- `/admin/feature-flags` [tela] → src/pages/admin/FeatureFlagsPage.tsx (protegida)
- `/admin/field-mapping` [tela] → src/pages/AdminFieldMapping.tsx (protegida)
- `/admin/insight-feedback` [tela] → src/pages/admin/InsightFeedbackAnalytics.tsx (protegida)
- `/admin/knowledge-export` [tela] → src/pages/AdminKnowledgeExport.tsx (protegida)
- `/admin/lux-config` [tela] → src/pages/AdminLuxConfig.tsx (protegida)
- `/admin/permissions` [tela] → src/pages/PermissionsPage.tsx (protegida)
- `/admin/role-permissions` [tela] → src/pages/RolePermissionsPage.tsx (protegida)
- `/admin/roles` [tela] → src/pages/RolesPage.tsx (protegida)
- `/admin/schema-drift` [tela] → src/pages/AdminSchemaDrift.tsx (protegida)
- `/admin/secrets-management` [tela] → src/pages/AdminSecretsManagement.tsx (protegida)
- `/admin/seguranca` [tela] → src/pages/admin/AdminSegurancaPage.tsx (protegida)
- `/admin/telemetria` [tela] → src/pages/AdminTelemetria.tsx (protegida)
- `/admin/voice-diagnostics` [tela] → src/pages/AdminVoiceDiagnostics.tsx (protegida)
- `/analytics` [tela] → src/pages/Analytics.tsx (protegida)
- `/assistente` [tela] → src/pages/Assistente.tsx (protegida)
- `/auth` [tela] → src/pages/Auth.tsx
- `/automacoes` [tela] → src/pages/Automacoes.tsx (protegida)
- `/bi` [tela] → src/pages/BIAvancado.tsx (protegida)
- `/cadastro` [tela] → src/pages/Cadastro.tsx (protegida)
- `/calendario` [tela] → src/pages/Calendario.tsx (protegida)
- `/campanhas` [tela] → src/pages/Campanhas.tsx (protegida)
- `/configuracoes` [tela] → src/pages/Configuracoes.tsx (protegida)
- `/contatos` [tela] → src/pages/Contatos.tsx (protegida)
- `/contatos/:id` [tela] → src/pages/ContatoDetalhe.tsx (protegida)
- `/contatos/:id/ficha-360` [tela] → src/pages/Ficha360.tsx (protegida)
- `/conversation-intelligence` [tela] → src/pages/ConversationIntelligence.tsx (protegida)
- `/conversation-intelligence/setup` [tela] → src/pages/ConversationIntelligenceSetup.tsx (protegida)
- `/crm/copywriting` [tela] → src/pages/crm/CopywritingEnterprise.tsx (protegida)
- `/customer-success` [tela] → src/pages/CustomerSuccess.tsx (protegida)
- `/customer-success/account/:id` [tela] → src/pages/CustomerSuccessAccount.tsx (protegida)
- `/deal-rooms` [tela] → src/pages/DealRooms.tsx (protegida)
- `/deal-rooms/:id` [tela] → src/pages/DealRoomDetail.tsx (protegida)
- `/deduplicacao` [tela] → src/pages/Deduplicacao.tsx (protegida)
- `/design-system` [tela] → src/pages/DesignSystem.tsx
- `/documentos` [tela] → src/pages/Documentos.tsx (protegida)
- `/dr/:token` [tela] → src/pages/PublicDealRoom.tsx
- `/empresas` [tela] → src/pages/Empresas.tsx (protegida)
- `/empresas/:companyId/analytics` [tela] → src/pages/CompanyProfileAnalytics.tsx (protegida)
- `/empresas/:id` [tela] → src/pages/EmpresaDetalhe.tsx (protegida)
- `/enrichment` [tela] → src/pages/Enrichment.tsx (protegida)
- `/erp` [tela] → src/pages/ErpViewer.tsx (protegida)
- `/f/:slug` [tela] → src/pages/PublicForm.tsx
- `/forecasting` [tela] → src/pages/Forecasting.tsx (protegida)
- `/forecasting/setup` [tela] → src/pages/ForecastingSetup.tsx (protegida)
- `/historico` [tela] → src/pages/Historico.tsx (protegida)
- `/inbox` [tela] → src/pages/Inbox.tsx (protegida)
- `/insights` [tela] → src/pages/Insights.tsx (protegida)
- `/intelligence` [tela] → src/pages/Intelligence.tsx (protegida)
- `/intelligence/auditoria` [tela] → src/pages/RecommendationAudit.tsx (protegida)
- `/intelligence/relacionamento/auditoria` [tela] → src/pages/CRMRelationshipAuditPage.tsx (protegida)
- `/intent` [tela] → src/pages/Intent.tsx (protegida)
- `/intent/setup` [tela] → src/pages/IntentSetup.tsx (protegida)
- `/interacoes` [tela] → src/pages/Interacoes.tsx (protegida)
- `/knowledge-base` [tela] → src/pages/KnowledgeBase.tsx (protegida)
- `/landing-pages` [tela] → src/pages/LandingPages.tsx (protegida)
- `/lead-scoring` [tela] → src/pages/LeadScoring.tsx (protegida)
- `/lead-scoring/automations` [tela] → src/pages/LeadScoringAutomations.tsx (protegida)
- `/lead-scoring/config` [tela] → src/pages/LeadScoringConfig.tsx (protegida)
- `/lm/:slug` [tela] → src/pages/PublicLeadMagnet.tsx
- `/lp/:slug` [tela] → src/pages/PublicLandingPage.tsx
- `/mapa-empresas` [tela] → src/pages/MapaEmpresas.tsx (protegida)
- `/marketing` [tela] → src/pages/MarketingHub.tsx (protegida)
- `/marketing/forms/:id` [tela] → src/pages/MarketingFormDetail.tsx (protegida)
- `/marketing/lead-magnets/:id` [tela] → src/pages/MarketingMagnetDetail.tsx (protegida)
- `/metas` [tela] → src/pages/Metas.tsx (protegida)
- `/network` [tela] → src/pages/Network.tsx (protegida)
- `/nlp-analytics` [tela] → src/pages/NLPAnalytics.tsx (protegida)
- `/notificacoes` [tela] → src/pages/Notificacoes.tsx (protegida)
- `/notificacoes/configuracoes` [tela] → src/pages/NotificacoesConfig.tsx (protegida)
- `/nps` [tela] → src/pages/NPS.tsx (protegida)
- `/nurturing` [tela] → src/pages/Nurturing.tsx (protegida)
- `/onboarding` [tela] → src/pages/Onboarding.tsx (protegida)
- `/perfis-comportamentais` [tela] → src/pages/PerfisComportamentais.tsx (protegida)
- `/performance` [tela] → src/pages/Performance.tsx (protegida)
- `/pipeline` [tela] → src/pages/Pipeline.tsx (protegida)
- `/playbooks` [tela] → src/pages/Playbooks.tsx (protegida)
- `/playbooks/:id` [tela] → src/pages/PlaybookDetail.tsx (protegida)
- `/playbooks/battle-cards/:id` [tela] → src/pages/BattleCardDetail.tsx (protegida)
- `/relatorio/:id` [tela] → src/pages/RelatorioContato.tsx (protegida)
- `/relatorios-customizaveis` [tela] → src/pages/CustomReports.tsx (protegida)
- `/report-builder` [tela] → src/pages/ReportBuilder.tsx (protegida)
- `/reset-password` [tela] → src/pages/ResetPassword.tsx
- `/revops` [tela] → src/pages/RevOps.tsx (protegida)
- `/rodizio` [tela] → src/pages/Rodizio.tsx (protegida)
- `/seguranca` [tela] → src/pages/Security.tsx (protegida)
- `/sequencias` [tela] → src/pages/Sequencias.tsx (protegida)
- `/signature/:token` [tela] → src/pages/PublicSignaturePage.tsx
- `/sms-marketing` [tela] → src/pages/SmsMarketing.tsx (protegida)
- `/sso/callback` [tela] → src/pages/SSOCallbackPage.tsx
- `/status` [tela] → src/pages/StatusPage.tsx
- `/suporte` [tela] → src/pages/Suporte.tsx (protegida)
- `/survey/:token` [tela] → src/pages/PublicSurvey.tsx
- `/tarefas` [tela] → src/pages/Tarefas.tsx (protegida)
- `/territorios` [tela] → src/pages/Territorios.tsx (protegida)
- `/territory-optimization` [tela] → src/pages/TerritoryOptimization.tsx (protegida)
- `/whatsapp` [redirect] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/whatsapp/importar` [tela] → src/pages/WhatsAppImport.tsx (protegida)
- `/win-loss` [tela] → src/pages/WinLoss.tsx (protegida)
- `/win-loss/setup` [tela] → src/pages/WinLossSetup.tsx (protegida)

## Rotas HTTP de backend
- `GET /a` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `DELETE /c` → scripts/ai-context/cenarios.mjs
- `PUT /d` → scripts/ai-context/cenarios.mjs
- `GET /users` → scripts/ai-context/cenarios.mjs
- `POST /users/:id` → scripts/ai-context/cenarios.mjs

## Vistas por id (menu/ViewRouter → arquivo)
- (nenhum)

## Edge functions
- `abm-account-scorer` — tabelas: abm_accounts, abm_buying_committee; chamada por 1 arquivo(s) do front
- `abm-whitespace-analyzer` — tabelas: abm_accounts, abm_buying_committee, abm_whitespace_opportunities; chamada por 1 arquivo(s) do front
- `ai-assistant` — tabelas: ai_chat_messages, ai_chat_threads, companies, contacts; chamada por 1 arquivo(s) do front
- `ai-email-refine` — tabelas: -; chamada por 1 arquivo(s) do front
- `ai-suggest-mapping` — tabelas: -; chamada por 1 arquivo(s) do front
- `ai-writing-assistant` — tabelas: -; chamada por 2 arquivo(s) do front
- `ask-crm` — tabelas: user_roles; chamada por 1 arquivo(s) do front
- `attribution-calculator` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `audit-analytics` — tabelas: audit_log; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `auto-rebatch-behavioral` — tabelas: behavioral_insight_feedback, contact_analytical_profiles, cron_secrets; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `auto-regen-behavioral-profiles` — tabelas: behavioral_profile_regen_queue, system_alerts; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `bitrix24-webhook` — tabelas: contacts, interactions; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `bulk-revalidate` — tabelas: contacts, validation_queue; chamada por 1 arquivo(s) do front
- `check-health-alerts` — tabelas: contacts, health_alert_settings, health_alerts, interactions; chamada por 1 arquivo(s) do front, por SQL/cron
- `check-notifications` — tabelas: contact_relatives, contacts, insights, interactions, life_events; chamada por 0 arquivo(s) do front, por SQL/cron
- `clear-must-reset-flag` — tabelas: migration_password_reset_log; chamada por 1 arquivo(s) do front
- `client-notifications` — tabelas: alerts, contacts, interactions, life_events, purchase_history; chamada por 0 arquivo(s) do front, por SQL/cron
- `connection-anomaly-detector` — tabelas: connection_anomalies, incoming_webhook_logs, incoming_webhooks; chamada por 1 arquivo(s) do front
- `connection-introspect` — tabelas: connection_configs, information_schema.columns, information_schema.tables; chamada por 1 arquivo(s) do front
- `connection-tester` — tabelas: connection_configs, connection_test_logs; chamada por 1 arquivo(s) do front
- `conversation-analyzer` — tabelas: conversation_analyses, conversation_topics_catalog, interactions, reframing_analysis, suggested_life_events; chamada por 2 arquivo(s) do front
- `conversation-coaching-digest` — tabelas: conversation_analyses; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `conversational-search` — tabelas: conversational_search_cache; chamada por 1 arquivo(s) do front
- `crm-automation-monitor` — tabelas: contacts, crm_automation_logs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `cs-health-recalc` — tabelas: alerts, cs_accounts, cs_health_signals; chamada por 0 arquivo(s) do front, por SQL/cron
- `deal-room-buyer-view` — tabelas: -; chamada por 1 arquivo(s) do front
- `deal-room-health` — tabelas: deal_room_milestones, deal_room_stakeholders, deal_rooms; chamada por 1 arquivo(s) do front
- `deal-room-share` — tabelas: deal_rooms; chamada por 1 arquivo(s) do front
- `demand-forecast` — tabelas: interactions; chamada por 1 arquivo(s) do front
- `detect-churn-risk` — tabelas: churn_risk_scores, contacts, interactions; chamada por 1 arquivo(s) do front
- `detect-new-device` — tabelas: device_login_notifications, user_known_devices; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `disc-analyzer` — tabelas: contacts, disc_analysis_history, disc_communication_logs; chamada por 3 arquivo(s) do front
- `dual-write-proxy` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `elevenlabs-scribe-token` — tabelas: -; chamada por 1 arquivo(s) do front
- `elevenlabs-tts` — tabelas: -; chamada por 1 arquivo(s) do front
- `email-finder` — tabelas: email_finder_results; chamada por 1 arquivo(s) do front
- `email-pipeline-health` — tabelas: -; chamada por 1 arquivo(s) do front
- `email-thread-summary` — tabelas: email_thread_summaries, interactions; chamada por 1 arquivo(s) do front
- `email-verifier` — tabelas: email_verifications; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `enrich-contacts` — tabelas: contacts; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `enrichlayer-linkedin` — tabelas: social_profiles; chamada por 1 arquivo(s) do front
- `error-budget` — tabelas: system_alerts, system_health_snapshots; chamada por 1 arquivo(s) do front
- `evolution-api` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `evolution-bitrix-connector` — tabelas: connector_log, oauth_tokens; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `evolution-webhook` — tabelas: contacts, interactions, whatsapp_ingestion_logs, whatsapp_instances, whatsapp_messages; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `external-data` — tabelas: -; chamada por 3 arquivo(s) do front
- `ficha360-conversation-summary` — tabelas: ficha360_conversation_summaries; chamada por 1 arquivo(s) do front
- `firecrawl-scrape` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `forecast-analyzer` — tabelas: deal_forecasts, forecast_quota_settings; chamada por 1 arquivo(s) do front
- `forecast-narrative` — tabelas: deal_forecasts, forecast_periods; chamada por 1 arquivo(s) do front
- `forecast-snapshot-cron` — tabelas: deal_forecasts, forecast_periods, forecast_snapshots; chamada por 0 arquivo(s) do front, por SQL/cron
- `form-submit-handler` — tabelas: -; chamada por 1 arquivo(s) do front
- `generate-behavioral-profile` — tabelas: behavioral_insight_feedback, call_logs, contacts, interactions, whatsapp_messages; chamada por 1 arquivo(s) do front
- `generate-insights` — tabelas: -; chamada por 1 arquivo(s) do front
- `generate-offer-suggestions` — tabelas: contact_analytical_profiles, contacts, interactions, offer_suggestions, purchase_history, social_behavior_analysis, social_insights; chamada por 1 arquivo(s) do front
- `get-signature` — tabelas: document_signatures, document_views; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `health` — tabelas: companies, profiles; chamada por 1 arquivo(s) do front
- `health-aggregate` — tabelas: alerts, companies, connection_configs, connection_test_logs, email_logs, incoming_webhook_logs, profiles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `incoming-webhook` — tabelas: incoming_webhook_dlq, incoming_webhook_logs, incoming_webhook_nonces, incoming_webhooks; chamada por 1 arquivo(s) do front
- `intent-aggregator` — tabelas: intent_scores, intent_signals; chamada por 1 arquivo(s) do front
- `intent-pixel-snippet` — tabelas: -; chamada por 1 arquivo(s) do front
- `intent-tracker` — tabelas: contacts, intent_signals, intent_tracking_pixels; chamada por 0 arquivo(s) do front
- `lead-score-cron` — tabelas: interactions, lead_score_recompute_queue; chamada por 0 arquivo(s) do front, por SQL/cron
- `lead-score-threshold-runner` — tabelas: alerts, contacts, lead_score_threshold_automations, lead_score_threshold_log; chamada por 0 arquivo(s) do front
- `lead-scorer` — tabelas: contacts, intent_signals, interactions, lead_score_recompute_queue, lead_score_rules, lead_score_thresholds, lead_scores; chamada por 1 arquivo(s) do front
- `lux-trigger` — tabelas: lux_intelligence, lux_webhook_config; chamada por 1 arquivo(s) do front
- `lux-webhook` — tabelas: contacts, lux_intelligence; chamada por 0 arquivo(s) do front
- `mcp-server` — tabelas: companies, connection_configs, contacts, deals, interactions, mcp_tool_calls; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `meeting-summary` — tabelas: interactions, meeting_summaries; chamada por 1 arquivo(s) do front
- `mql-evaluator` — tabelas: contacts, mql_classifications, mql_criteria; chamada por 0 arquivo(s) do front, por SQL/cron
- `next-best-action` — tabelas: contact_analytical_profiles, contact_next_actions, contacts, interactions, neuro_behavioral_history, whatsapp_messages; chamada por 1 arquivo(s) do front
- `nurturing-runner` — tabelas: interactions, nurturing_executions, nurturing_workflows, tasks; chamada por 1 arquivo(s) do front, por SQL/cron
- `objection-context-summary` — tabelas: interactions; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `objection-handler` — tabelas: contact_objection_scripts, contacts, crm_objection_intelligence; chamada por 1 arquivo(s) do front
- `phone-validator` — tabelas: phone_validations; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `playbook-generator` — tabelas: sales_playbooks; chamada por 1 arquivo(s) do front
- `playbook-recommender` — tabelas: battle_cards, sales_playbooks; chamada por 1 arquivo(s) do front
- `process-behavioral-regen-queue` — tabelas: behavioral_profile_regen_queue; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `process-webhook-dlq` — tabelas: incoming_webhook_dlq, incoming_webhooks; chamada por 1 arquivo(s) do front, por SQL/cron
- `retry-behavioral-profile` — tabelas: behavioral_profile_regen_queue; chamada por 1 arquivo(s) do front
- `revops-snapshot-builder` — tabelas: contacts, deal_forecasts, mql_classifications, revops_alerts, revops_snapshots; chamada por 1 arquivo(s) do front, por SQL/cron
- `rfm-analyzer` — tabelas: contacts, interactions, purchase_history; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `semantic-search` — tabelas: semantic_search_cache; chamada por 1 arquivo(s) do front
- `send-push-notification` — tabelas: push_subscriptions; chamada por 0 arquivo(s) do front
- `send-sms-campaign` — tabelas: contacts, sms_campaign_recipients, sms_campaigns, sms_opt_outs; chamada por 1 arquivo(s) do front
- `send-transactional-email` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `sequence-processor` — tabelas: contacts, sequence_email_reservations, sequence_enrollments, sequence_events, sequence_send_log, sequence_steps, sequences; chamada por 1 arquivo(s) do front, por SQL/cron
- `sequence-track` — tabelas: sequence_events, sequence_send_log; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `smart-notify` — tabelas: contact_automation_settings, contact_next_actions, notification_logs, profiles; chamada por 1 arquivo(s) do front, por SQL/cron
- `smart-reminders` — tabelas: contact_automation_settings, contact_next_actions, contacts, interactions, life_events; chamada por 1 arquivo(s) do front
- `social-behavior-analyzer` — tabelas: contact_analytical_profiles, contacts, interactions, social_behavior_analysis, social_profiles; chamada por 0 arquivo(s) do front
- `social-events-detector` — tabelas: notifications, social_life_events, social_profiles, social_scraping_schedule; chamada por 1 arquivo(s) do front
- `social-profile-scraper` — tabelas: social_life_events, social_profiles, social_scraping_schedule, suggested_rapport_intel; chamada por 2 arquivo(s) do front
- `submit-signature` — tabelas: document_signatures; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `suggest-next-action` — tabelas: contact_predictive_roadmap, contacts, interactions; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `sync-social-interests` — tabelas: psychographic_audit_log, social_behavior_analysis, social_sync_queue; chamada por 1 arquivo(s) do front
- `system-health` — tabelas: alerts, companies, email_logs, profiles, system_health_snapshots; chamada por 2 arquivo(s) do front
- `template-success-notifications` — tabelas: alerts, contacts, favorite_templates, profiles, push_subscriptions, trigger_usage_history; chamada por 1 arquivo(s) do front, por SQL/cron
- `territory-optimization` — tabelas: sales_team_members; chamada por 1 arquivo(s) do front
- `validate-access` — tabelas: access_blocked_log, access_security_settings, geo_allowed_countries, ip_whitelist; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `validation-queue-worker` — tabelas: validation_queue; chamada por 1 arquivo(s) do front, por SQL/cron
- `visual-search` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-agent` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-ai-health` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-to-text` — tabelas: interactions, whatsapp_messages; chamada por 2 arquivo(s) do front
- `weekly-digest` — tabelas: contacts, interactions, profiles, weekly_report_settings, weekly_reports; chamada por 1 arquivo(s) do front, por SQL/cron
- `whatsapp-import` — tabelas: companies, contacts, whatsapp_ingestion_logs, whatsapp_messages, whatsapp_transcriptions; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `win-loss-analyzer` — tabelas: win_loss_insights, win_loss_records; chamada por 1 arquivo(s) do front
- `win-loss-record-deal` — tabelas: win_loss_records; chamada por 0 arquivo(s) do front — **ÓRFÃ**

## Cron jobs (pg_cron / vercel)
- `ai-gateway-alerts-eval` */5 * * * * (20260723152932_9ebcb761-6420-4de9-8bed-a2faa40d9998.sql)
- `ai-gateway-metrics-drop-old` 0 4 * * 0 (20260723154109_ad0a12c4-62a1-4a6a-928e-686b828d2fe1.sql)
- `ai-gateway-metrics-ensure-partition` 15 3 * * * (20260723154109_ad0a12c4-62a1-4a6a-928e-686b828d2fe1.sql)
- `apply-data-retention-daily` 15 3 * * * (20260723112943_04c3b77d-d9d6-4d99-bbf5-3840c2f21707.sql)
- `auto_resolve_ai_gateway_alerts` 2-59/5 * * * * (20260723153336_b3712da2-293a-4171-a31a-fc96c83b4051.sql)
- `capture-degraded-rpc-plans` */15 * * * * (20260726144422_a6bd4ac3-10b1-4e7d-a630-5e05b9b2da19.sql)
- `check-contact-health-daily` 0 0 * * * (20261111233000_reagenda_rotinas_sql_e_rpc_nurturing.sql)
- `cleanup_cron_job_run_details_daily` 37 4 * * * (20261108190000_cron_job_run_details_retention.sql)
- `cleanup_rpc_perf_samples_daily` 15 3 * * * (20260723154748_e54bdf5c-194f-4d5a-b5af-46c786cfc8ac.sql)
- `cleanup-simulated-alerts-weekly` 0 3 * * 0 (20261111233000_reagenda_rotinas_sql_e_rpc_nurturing.sql)
- `mtta-auto-ack-heartbeat-watchdog` */30 * * * * (20261111233000_reagenda_rotinas_sql_e_rpc_nurturing.sql)
- `mtta-sla-breach-auto-ack-hourly` 7 * * * * (20261111233000_reagenda_rotinas_sql_e_rpc_nurturing.sql)
- `revalidate-stale-emails` 0 4 * * * (20261111233000_reagenda_rotinas_sql_e_rpc_nurturing.sql)
- `revalidate-stale-phones` 30 4 * * * (20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql)
- `singu-edge-check-health-alerts` 17 * * * * → edge check-health-alerts (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-check-notifications` 7 * * * * → edge check-notifications (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-client-notifications` 3 11 * * * → edge client-notifications (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-cs-health-recalc` 40 5 * * * → edge cs-health-recalc (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-forecast-snapshot-cron` 10 6 * * * → edge forecast-snapshot-cron (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-lead-score-cron` 20 5 * * * → edge lead-score-cron (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-mql-evaluator` 27 * * * * → edge mql-evaluator (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-nurturing-runner` 4-59/15 * * * * → edge nurturing-runner (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-process-webhook-dlq` 1-59/5 * * * * → edge process-webhook-dlq (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-revops-snapshot-builder` 0 4 * * * → edge revops-snapshot-builder (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-sequence-processor` 2-59/5 * * * * → edge sequence-processor (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-template-success-notifications` 13 12 * * * → edge template-success-notifications (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-validation-queue-worker` */5 * * * * → edge validation-queue-worker (20261111210500_agenda_edge_functions_cron.sql)
- `singu-edge-weekly-digest` 23 11 * * 1 → edge weekly-digest (20261111210500_agenda_edge_functions_cron.sql)
- `singu-rodizio-bloqueios` 10 7 * * * (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `singu-rodizio-closer` 0 6 * * 1 (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `singu-rodizio-sdr` 10 6 * * 1 (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `singu-rodizio-segmentar` 0 1 * * * (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `smart-notify-automation` 0 */4 * * * → edge smart-notify (20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql)
- `validation-queue-drain` */5 * * * * → edge validation-queue-worker (20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql)

## Integrações externas
- SDKs: ElevenLabs, Supabase, react-query, zod
- hosts mais citados: ai.gateway.lovable.dev, canonical.supabase.co, example.test, x.supabase.co, api.elevenlabs.io, test.supabase.co, wa.me, example.invalid, api.exemplo.com, api.firecrawl.dev, api.supabase.com, singu-v2.vercel.app, api.deepseek.com, api.lovable.dev, api.resend.com
- webhooks recebidos: nenhum
- env de integração (só nomes): BITRIX_APPLICATION_TOKEN, BITRIX_CLIENT_ID, BITRIX_CLIENT_SECRET, BITRIX_WEBHOOK_URL, CRON_SECRET, DEEPSEEK_API_KEY, ELEVENLABS_API_KEY, ENRICHLAYER_API_KEY, EVOLUTION_API_KEY, EVOLUTION_API_URL, EVOLUTION_BITRIX_CONNECTOR_URL, EVOLUTION_INSTANCE_NAME, EVOLUTION_WEBHOOK_SECRET, FIRECRAWL_API_KEY, LOVABLE_API_KEY, N8N_LUX_WEBHOOK_URL, RESEND_API_KEY, RESEND_FROM, TWILIO_API_KEY

## Permissões / papéis
- papéis no código: user (38), system (32), status (30), alert (24), group (18), button (10), img (7), contact (5), region (5), dialog (4), assistant (3), decision_maker (3), meter (3), radio (3), radiogroup (3), authenticated (2), combobox (2), menuitem (2), menuitemcheckbox (2), navigation (2), note (2), owner (2), service_role (2), a (1), anon (1), b (1), banner (1), figure (1), link (1), list (1), main (1), menu (1), presentation (1), progressbar (1), tab (1), tablist (1)
- enums de papel: app_role: admin|moderator|user; entity_relationship_role: buyer|manager|owner|decision_maker|influencer|user|sponsor|partner|supplier|subsidiary|parent|employee_of|other; salesperson_role: sdr|closer|hybrid
- guards: src/app/lazyPages.tsx, src/components/auth/MFAGuard.tsx, src/hooks/useAuth.tsx · rotas protegidas: 102 · públicas: /*, /auth, /design-system, /dr/:token, /f/:slug, /lm/:slug, /lp/:slug, /reset-password, /signature/:token, /sso/callback, /status, /survey/:token
- feature flags: nenhuma

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 6 — ex.: 1º Contato -> primeiro_contato, Fechamento -> fechamento, Negociação -> negociacao
- edges_orfas: 29 — ex.: attribution-calculator, audit-analytics, auto-rebatch-behavioral
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 9 — ex.: audit_log_default, company_addresses, company_emails
- tabelas_usadas_sem_definicao: 4 — ex.: information_schema.columns, information_schema.tables, logs
- tabelas_com_drift_migration_vs_types: 88 — ex.: access_blocked_log, access_security_settings, activities
- rpcs_sem_definicao: 2 — ex.: get_territories, get_territory_performance
- componentes_orfaos: 44 — ex.: src/components/admin/AccessSecurityManager.tsx, src/components/admin/EmailPipelineStatus.tsx, src/components/admin/SystemHealthWidget.tsx
- componentes_com_nome_duplicado: 106 — ex.: ABM, ABMAccountDetail, ABMCampaigns
- scripts_orfaos: 8 — ex.: scripts/hardening/check-client-tls.sql, scripts/hardening/check-extensions-hardening.sql, scripts/hardening/check-indexes-duplicated.sql
- env_usadas_nao_declaradas: 4 — ex.: DEV, PROD, VITE_APP_VERSION
- ciclos_de_import: 5
- possiveis_segredos_no_codigo: 13 — ex.: scripts/ai-context/gerar.unit.mjs:40, scripts/ai-context/gerar.unit.mjs:41, scripts/ai-context/gerar.unit.mjs:42

## Grafo de código (graphify)
- 21154 nós · 35846 arestas · 2116 comunidades · grafo do commit `682ad793`
- comunidades maiores: ref_components (308), sonner (270), framer-motion (260), 02_tables.sql (259), ref_lib (258), useAuth (258), _shared/auth.ts (251), lucide-react (236), 📖 Dicionário de Dados — SINGU CRM (227), date-fns (221), react-router-dom (219), ref_hooks (199)
- símbolos mais chamados: useAuth() (src/hooks/useAuth.tsx), q() (scripts/supabase_snapshot/snapshot.py), mig_die() (scripts/migration/_lib.sh), .collect() (scripts/supabase_snapshot/test_snapshot.py), excluded_sql() (scripts/supabase_snapshot/snapshot.py), fail() (scripts/automation/common.mjs), jsonError() (supabase/functions/_shared/auth.ts), MaintenanceError (scripts/maintenance/common.mjs), fail() (scripts/graphify-local/common.mjs), mig_help() (scripts/migration/_lib.sh), mig_load_env() (scripts/migration/_lib.sh), .iniciar() (scripts/migration/_mock_supabase.ts)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- CHANGELOG.md (48)
- .github/workflows/ci.yml (23)
- package.json (19)
- supabase/functions/external-data/index.ts (15)
- docs/prod-readiness.md (14)
- package-lock.json (14)
- docs/qa/security-definer-audit.md (12)
- tests/rls/security_definer_hardening.sql (11)
- src/hooks/useContacts.ts (10)
- src/lib/externalData.ts (10)
- inventario/estado/banco.json (9)
- .github/workflows/rls-exposure-guard.yml (8)
- inventario/estado/edges.json (8)
- inventario/estado/tabelas-uso.json (8)
- supabase/tests/get_contact_sidebar_by_phone.sql (7)

## Workflows
- `automation-local.yml` — Automação local (pull_request, push, workflow_dispatch)
- `ci.yml` — CI (pull_request, push)
- `contexto.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 3 * * * *)
- `docs-ci.yml` — Documentação sem drift (pull_request, push)
- `estado-real.yml` — Estado real do repositório (pull_request, push, workflow_dispatch)
- `fix-jwt-proxies-externas.yml` — Fix JWT proxies externas (workflow_dispatch)
- `higiene-semanal.yml` — Higiene semanal do repositório (schedule, workflow_dispatch; cron 41 8 * * 1)
- `inventario-estado-semanal.yml` — Inventário do estado real (semanal) (schedule, workflow_dispatch; cron 23 10 * * 1)
- `monitoring-lint.yml` — monitoring-lint (pull_request, push)
- `restore-drill.yml` — Teste de restauração lógica (pull_request, workflow_dispatch)
- `rls-exposure-guard.yml` — RLS exposure guard (pull_request, push, schedule, workflow_dispatch; cron 0 6 * * 1)

## Scripts npm
- `maintenance:doctor`: `sh scripts/maintenance/run.sh doctor --root .`
- `maintenance:check`: `sh scripts/maintenance/run.sh check --root . --ref origin/main`
- `maintenance:heal`: `sh scripts/maintenance/run.sh heal --root . --ref origin/main`
- `test:maintenance`: `node --test scripts/maintenance/maintenance.unit.mjs`
- `dev`: `vite`
- `build`: `vite build`
- `build:dev`: `vite build --mode development`
- `graphify:build`: `graphify extract . --code-only && graphify cluster-only . --no-label`
- `graphify:query`: `graphify query`
- `graphify:update`: `graphify update .`
- `lint`: `eslint .`
- `typecheck`: `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json`
- `preview`: `vite preview`
- `check:edge-imports`: `node scripts/check-edge-imports.mjs`
- `test`: `vitest run`
- `test:unit`: `vitest run`
- `test:coverage`: `vitest run --coverage --reporter=default`
- `pretest:e2e`: `npm run build`
- `test:e2e`: `playwright test`
- `test:e2e:ui`: `playwright test --ui`
- `contexto:ia`: `node scripts/ai-context/gerar.mjs --out docs/contexto/codigo`
- `contexto:ia:test`: `node --test scripts/ai-context/gerar.unit.mjs`
- `contexto:regras`: `python3 scripts/regras_negocio/generate.py --repo . --out docs/contexto/regras --profile regras --schema-snapshot docs/contexto/supabase --index-path docs/contexto/00-INDEX.md --no-pointer`
- `contexto:banco`: `python3 scripts/supabase_snapshot/snapshot.py`
- `estado:testes`: `node scripts/ci/check-test-inventory.mjs`
- `estado:workflows`: `node scripts/ci/workflow-invariants.mjs`
- `estado:instrucoes`: `node scripts/ci/check-claude-md-integrity.mjs`
- `contexto:indice`: `python3 scripts/regras_negocio/indice.py --repo . --out docs/contexto/00-INDEX.md --remote adm01-debug/Singu_V2 --fonte "banco real=docs/contexto/supabase" --fonte "código=docs/contexto/codigo" --fonte "regras de negócio=docs/contexto/regras"`
- `automation:doctor`: `node scripts/automation.mjs doctor`
- `automation:test`: `node scripts/automation.mjs test`
- `automation:check`: `node scripts/automation.mjs check --ref HEAD`
- `automation:heal`: `node scripts/automation.mjs heal --ref origin/main`
- `automation:nightly`: `node scripts/automation.mjs nightly --ref origin/main`
- `automation:graph`: `node scripts/automation.mjs graph`
- `automation:status`: `node scripts/automation.mjs graph status`
- `automation:install-hooks`: `node scripts/automation.mjs install-hooks`
- `automation:uninstall-hooks`: `node scripts/automation.mjs uninstall-hooks`

## Documentos (raiz e docs/)
- `AGENTS.md` — AGENTS.md — Singu_V2 (75 linhas)
- `ARCHITECTURE.md` — Arquitetura do SINGU CRM (150 linhas)
- `AUDITORIA.md` — Auditoria técnica total — SINGU CRM (209 linhas)
- `AUDITORIA_COMPLETA_SISTEMA.md` — AUDITORIA COMPLETA DO SISTEMA SINGU CRM v2 (425 linhas)
- `AUDITORIA_SISTEMA.md` — 🔍 AUDITORIA EXAUSTIVA — SINGU CRM (307 linhas)
- `CHANGELOG.md` (420 linhas)
- `CLAUDE.md` (2 linhas)
- `CONTRIBUTING.md` — Guia de Contribuição — SINGU CRM (179 linhas)
- `ESTADO_ATUAL.md` — ESTADO ATUAL DO SISTEMA — SINGU CRM v2 (372 linhas)
- `FIELD_MAPPING.md` — Mapeamento Campo-a-Campo: Banco Local ↔ Banco Externo (288 linhas)
- `FUNCIONALIDADES_SISTEMA.md` — 📋 SINGU CRM — Levantamento Completo de Funcionalidades (434 linhas)
- `HANDOFF.md` — SINGU CRM — Handoff Document (193 linhas)
- `PENDENCIAS.md` — PENDENCIAS.md — Bloqueios e itens fora do escopo (Singu_V2) (114 linhas)
- `PLANEJADO_NAO_EXECUTADO.md` — PLANEJADO × EXECUTADO — SINGU CRM v2 (637 linhas)
- `README.md` — SINGU CRM (193 linhas)
- `RELATORIO_CI.md` — RELATORIO_CI.md — Correção dos workflows com falha (Singu_V2) (123 linhas)
- `audit_report.md` — 🔍 RELATÓRIO DE AUDITORIA ENTERPRISE — SINGU CRM (88 linhas)
- `docs/ARCHITECTURE.md` — SINGU CRM — Arquitetura Consolidada (123 linhas)
- `docs/AUDIT_VALIDATION_23_10.md` — Rodada 23/10 — Validação Exaustiva dos Guards (11–22) (188 linhas)
- `docs/AUTOMACAO_LOCAL.md` — Automação local — Singu_V2 (357 linhas)
- `docs/CHANGELOG_1.0_1.5.md` — Histórico de versões 1.0.0 a 1.5.0 (73 linhas)
- `docs/CHAOS_DRILL.md` — Chaos Drill Runbook (41 linhas)
- `docs/COMPLETE_SYSTEM_ANALYSIS.md` — 📊 ANÁLISE COMPLETA DO SISTEMA RelateIQ CRM (899 linhas)
- `docs/DATABASE_ANALYSIS.md` — 📊 Análise Exaustiva do Banco de Dados - RelateIQ (1291 linhas)
- `docs/DATA_DICTIONARY.md` — SINGU CRM — Dicionário de Dados (112 linhas)
- `docs/DISASTER_RECOVERY.md` — SINGU CRM — Disaster Recovery Plan (114 linhas)
- `docs/EDGE_FUNCTIONS_API.md` — SINGU CRM — Edge Functions API Reference (383 linhas)
- `docs/GET_CONTACT_SIDEBAR_BY_PHONE.md` — RPC `get_contact_sidebar_by_phone(p_phone text)` (94 linhas)
- `docs/GRAPHIFY.md` — Graphify (37 linhas)
- `docs/HARDENING_FINAL_10_10.md` — 🏆 SINGU SECURITY HARDENING - SCORE 10/10 (112 linhas)
- `docs/HARDENING_PHASE2_20260410.md` — 🛡️ Hardening Phase 2 — BD Físico pgxfvjmuubtbowutlide (52 linhas)
- `docs/HARDENING_PHASE3_FINAL.md` — 🛡️ Security Hardening Phase 3 — Final Report (116 linhas)
- `docs/HOTFIX_PROCEDURE.md` — 🚨 Procedimento de Hotfix (16 linhas)
- `docs/LOAD_TESTING.md` — Load Testing — k6 (67 linhas)
- `docs/MIGRATION_DATA.md` — Migração de Dados — Runbook (psql + \COPY) (138 linhas)
- `docs/MIGRATION_DDL.md` — Migração DDL — Runbook (128 linhas)
- `docs/MIGRATION_EDGE_FUNCTIONS.md` — Migração das Edge Functions — Runbook (224 linhas)
- `docs/MIGRATION_EXECUTIVE_BRIEF.md` — Migração Supabase — Brief Executivo (49 linhas)
- `docs/MIGRATION_MASTER_RUNBOOK.md` — Migration Master Runbook — Supabase → Supabase (187 linhas)
- `docs/MIGRATION_PASSWORD_RESET.md` — Reset de Senhas Pós-Migração — Runbook (179 linhas)
- `docs/MIGRATION_POSTMORTEM_TEMPLATE.md` — Postmortem — Migração Origem para Destino (70 linhas)
- `docs/MIGRATION_STORAGE.md` — Migração de Storage — Runbook (Supabase → Supabase) (137 linhas)
- `docs/ONBOARDING.md` — SINGU CRM — Guia de Onboarding para Desenvolvedores (140 linhas)
- `docs/PR3_CLOSED_REFERENCE.md` — PR #3 — Fechado como referência histórica (25 linhas)
- `docs/PRODUCT_DESIGN_STRATEGY_ANALYSIS_V6.md` — 🎨 ANÁLISE DE PRODUCT DESIGN STRATEGY - RelateIQ CRM (883 linhas)
- `docs/QA_ANALYSIS_REPORT.md` — 📋 Relatório de Análise QA - RelateIQ (367 linhas)
- `docs/RUNBOOK.md` — SINGU CRM — Runbook Operacional (693 linhas)
- `docs/SECURITY.md` — SINGU CRM — Política de Segurança (83 linhas)
- `docs/SIGNING_KEY_ROTATION.md` — Signing Key Rotation Runbook (79 linhas)
- `docs/SYSTEM_EXCELLENCE_10_10.md` — 🏆 SINGU CRM — Estado de Excelência Técnica 10/10 (41 linhas)
- `docs/TECH_DEBT.md` — 🚩 TECH DEBT BACKLOG — SINGU CRM (46 linhas)
- `docs/audit_report.md` — 🔍 RELATÓRIO DE AUDITORIA ENTERPRISE — SINGU CRM (88 linhas)
- `docs/data-dictionary.md` — 📖 Dicionário de Dados — SINGU CRM (4488 linhas)
- `docs/er-diagram.md` — 📊 Diagrama Entidade-Relacionamento (ER) (8 linhas)
- `docs/postmortem-example.md` — Post-Mortem — Indisponibilidade parcial do salvamento de contatos (external-data) (99 linhas)
- `docs/postmortem-template.md` — Post-Mortem — {Título do Incidente} (96 linhas)
- `docs/prod-readiness.md` — Prod Readiness ? Singu_V2 (328 linhas)
- `docs/ux_improvement_strategy.md` (73 linhas)
- subpastas de docs/: docs/adr (25), docs/lacunas (17), docs/estado (12), docs/auditoria (8), docs/qa (8), docs/agentes (5), docs/contexto (2), docs/dr (2), docs/dr-drills (2), docs/runbooks (2), docs/ci (1), docs/perf (1)
- CHANGELOG topo: [Unreleased]

## Últimos commits
- 2026-11-18 `682ad79` docs(pendencias): corrige o diagnostico errado do P7 e fecha P0 e P5 (#242)
- 2026-11-18 `adb1e39` fix(ci): recupera correcao de grafia nos nomes de step perdida no squash (#241)
- 2026-11-18 `91be466` fix(ci): destrava o CI da main - heap do typecheck e audit gate (#239)
- 2026-11-18 `10085c6` fix(db): recupera trabalho pendente de outros agentes nas branches (#238)
- 2026-11-18 `d136c19` fix(db): remove 18 indices exatamente duplicados (auditoria ao vivo) (#232)
- 2026-11-18 `986ffa4` build(deps): bump actions/setup-node from 6.5.0 to 7.1.0 (#236)
- 2026-11-18 `563e484` build(deps): bump peter-evans/create-pull-request from 8.1.1 to 8.1.3 (#235)
- 2026-11-18 `c027a81` chore(ci): roda os testes de edge function orfaos no pipeline (#231)
- 2026-11-18 `889a650` build(deps): bump the minor-and-patch group with 11 updates (#237)
- 2026-11-18 `ba42905` fix(ci): remove BOM UTF-8 da migration do MTTA que quebra o Supabase Preview (#233)
- 2026-11-14 `0a7b484` chore: contexto agendado de 10 min para 1x/hora (#234)
- 2026-11-14 `4f4b782` fix: ativa strict mode no tsconfig.app e corrige tipos (#230)
- 2026-11-14 `03b943a` chore(docs): bump prod-readiness pos-merge 228 (final) (#229)
- 2026-11-14 `2f70928` chore(docs): bump prod-readiness pos-merge 227 (final) (#228)
- 2026-11-14 `4e67de3` chore(docs): bump prod-readiness pos-merge 226 (#227)

## Arquivos deste diretório
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/manifest.json` (commit, data, hashes, erros — único arquivo com data/hora)
