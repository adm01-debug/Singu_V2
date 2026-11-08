# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado em `docs/contexto/codigo/` na branch `contexto` (gerada, nunca abra PR dela) a cada push em `main` e a cada 10 minutos pelo workflow `contexto.yml`; índice único das três fontes em `docs/contexto/00-INDEX.md`. Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `de99442c539a4e630038c92fe9d958febec43478` (2026-11-08T12:40:56-03:00).

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
- linguagens: TypeScript (2012), SQL (641), Markdown (147), Shell (70), JavaScript (42), JSON (14), YAML (12), Python (10)
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
| arquivos_total | 2970 |
| arquivos_codigo | 2063 |
| linhas_codigo | 388167 |
| rotas | 114 |
| rotas_http_backend | 12 |
| vistas_por_id | 0 |
| itens_menu | 56 |
| modulos | 141 |
| componentes | 1056 |
| hooks | 407 |
| edge_functions | 108 |
| tabelas | 418 |
| migrations | 475 |
| cron_jobs | 19 |
| testes | 202 |
| workflows | 6 |
| scripts | 213 |
| docs_md | 147 |

## Onde ficam as coisas
- telas: src/components (1), src/pages (1)
- componentes: src/components (907), src/pages (140), src/app (4)
- hooks: src/hooks (376), src/components (20), src/stores (5)
- servicos_logica: src/lib (71), src/data (46), src/domain (8)
- testes: co-localizado (__tests__) (88), co-localizado (*.test) (80), tests/ (22)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/migration (159), scripts/hardening (9), scripts/inventario (4)
- docs: docs (39), (raiz) (16)
- nomenclatura: {"componentes":"PascalCase (93%)","hooks":"use + PascalCase","servicos":"camelCase (92%)","edge_functions":"kebab-case (99%)","tabelas":"snake_case (90%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| app | 0 | 0 | 6 | 636 | 68 | 228 |
| components/abm | 0 | 0 | 8 | 19 | 2 | 6 |
| components/admin | 0 | 0 | 44 | 35 | 12 | 19 |
| components/analytics | 0 | 0 | 42 | 79 | 2 | 26 |
| components/bi | 0 | 0 | 5 | 20 | 2 | 6 |
| components/carnegie | 0 | 0 | 12 | 1 | 0 | 0 |
| components/companies | 0 | 0 | 5 | 7 | 1 | 2 |
| components/company-detail | 0 | 0 | 29 | 65 | 2 | 11 |
| components/contact-detail | 0 | 0 | 109 | 123 | 14 | 75 |
| components/contacts | 0 | 0 | 10 | 15 | 2 | 10 |
| components/conversation-intel | 0 | 0 | 11 | 12 | 1 | 5 |
| components/crm | 0 | 0 | 34 | 17 | 1 | 37 |
| components/customer-success | 0 | 0 | 8 | 14 | 0 | 6 |
| components/dashboard | 0 | 0 | 46 | 99 | 6 | 38 |
| components/deal-rooms | 0 | 0 | 8 | 22 | 3 | 8 |
| components/disc | 0 | 0 | 9 | 5 | 0 | 5 |
| components/enrichment | 0 | 0 | 11 | 25 | 4 | 15 |
| components/feedback | 0 | 0 | 16 | 9 | 0 | 1 |
| components/ficha-360 | 0 | 0 | 36 | 48 | 4 | 14 |
| components/forecasting | 0 | 0 | 9 | 14 | 2 | 5 |
| components/forms | 0 | 0 | 17 | 23 | 3 | 11 |
| components/gamification | 0 | 0 | 5 | 8 | 1 | 2 |
| components/intel | 0 | 0 | 34 | 13 | 1 | 4 |
| components/intelligence | 0 | 0 | 5 | 15 | 2 | 7 |
| components/intent | 0 | 0 | 5 | 11 | 2 | 4 |
| components/interactions | 0 | 0 | 42 | 43 | 3 | 17 |
| components/layout | 0 | 0 | 6 | 306 | 24 | 89 |
| components/lead-routing | 0 | 0 | 6 | 16 | 0 | 10 |
| components/lead-scoring | 0 | 0 | 13 | 17 | 1 | 7 |
| components/lux | 0 | 0 | 6 | 3 | 1 | 3 |
| components/micro-interactions | 0 | 0 | 6 | 0 | 0 | 0 |
| components/navigation | 0 | 0 | 12 | 306 | 24 | 89 |
| components/neuromarketing | 0 | 0 | 17 | 1 | 0 | 0 |
| components/nlp | 0 | 0 | 33 | 10 | 2 | 9 |
| components/onboarding | 0 | 0 | 8 | 5 | 0 | 3 |
| components/pipeline | 0 | 0 | 9 | 14 | 1 | 6 |
| components/playbooks | 0 | 0 | 6 | 14 | 2 | 4 |
| components/revops | 0 | 0 | 5 | 9 | 1 | 4 |
| components/search | 0 | 0 | 12 | 13 | 5 | 7 |
| components/security | 0 | 0 | 9 | 8 | 0 | 5 |
| components/sequences | 0 | 0 | 7 | 8 | 1 | 8 |
| components/skeletons | 9 | 13 | 5 | 0 | 0 | 0 |
| components/stakeholders | 0 | 0 | 10 | 6 | 0 | 3 |
| components/triggers | 0 | 0 | 33 | 12 | 1 | 10 |
| components/ui | 0 | 0 | 72 | 10 | 0 | 2 |
| components/win-loss | 0 | 0 | 8 | 17 | 1 | 5 |
| data | 0 | 0 | 46 | 3 | 0 | 6 |
| domain | 0 | 0 | 8 | 1 | 1 | 2 |
| hooks | 0 | 0 | 374 | 627 | 53 | 206 |
| hooks/voice | 0 | 0 | 9 | 2 | 0 | 1 |
| lib | 0 | 0 | 67 | 16 | 2 | 13 |
| pages | 2 | 1 | 105 | 613 | 66 | 222 |
| pages/admin | 0 | 0 | 9 | 322 | 26 | 96 |
| pages/mapa | 0 | 0 | 5 | 5 | 1 | 4 |
| stores | 0 | 0 | 5 | 1 | 0 | 0 |
| types | 0 | 0 | 20 | 0 | 0 | 0 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/Index.tsx (protegida)
- `/*` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/abm` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/abm/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/abm/campanhas` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/audit-trail` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/behavioral-regen-audit` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/component-gallery` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/conexoes` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/conexoes/logs` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/docs` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/email-diagnostics` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/error-budget` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/error-logs` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/feature-flags` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/field-mapping` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/insight-feedback` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/knowledge-export` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/lux-config` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/permissions` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/role-permissions` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/roles` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/schema-drift` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/secrets-management` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/seguranca` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/telemetria` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/admin/voice-diagnostics` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/analytics` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/assistente` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/auth` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/automacoes` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/bi` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/cadastro` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/calendario` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/campanhas` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/configuracoes` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/contatos` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/contatos/:id` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/contatos/:id/ficha-360` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/conversation-intelligence` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/conversation-intelligence/setup` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/crm/copywriting` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/customer-success` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/customer-success/account/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/deal-rooms` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/deal-rooms/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/deduplicacao` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/design-system` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/documentos` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/dr/:token` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/empresas` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/empresas/:companyId/analytics` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/empresas/:id` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/enrichment` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/erp` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/f/:slug` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/forecasting` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/forecasting/setup` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/historico` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/inbox` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/insights` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/intelligence` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/intelligence/auditoria` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/intelligence/relacionamento/auditoria` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/intent` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/intent/setup` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/interacoes` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/knowledge-base` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/landing-pages` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/lead-scoring` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/lead-scoring/automations` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/lead-scoring/config` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/lm/:slug` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/lp/:slug` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/mapa-empresas` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/marketing` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/marketing/forms/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/marketing/lead-magnets/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/metas` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/network` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/nlp-analytics` [tela] → src/components/skeletons/PageSkeletons.tsx (protegida)
- `/notificacoes` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/notificacoes/configuracoes` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/nps` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/nurturing` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/onboarding` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/perfis-comportamentais` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/performance` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/pipeline` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/playbooks` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/playbooks/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/playbooks/battle-cards/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/relatorio/:id` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/relatorios-customizaveis` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/report-builder` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/reset-password` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/revops` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/rodizio` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/seguranca` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/sequencias` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/signature/:token` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/sms-marketing` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/sso/callback` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/status` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/suporte` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/survey/:token` [tela] → **ARQUIVO NÃO RESOLVIDO**
- `/tarefas` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/territorios` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/territory-optimization` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/whatsapp` [redirect] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/whatsapp/importar` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/win-loss` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)
- `/win-loss/setup` [tela] → **ARQUIVO NÃO RESOLVIDO** (protegida)

## Rotas HTTP de backend
- `GET /{t}` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `GET /a` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `POST /b` → scripts/ai-context/cenarios.mjs
- `DELETE /c` → scripts/ai-context/cenarios.mjs
- `PUT /d` → scripts/ai-context/cenarios.mjs
- `GET /items` → scripts/ai-context/gerar.unit.mjs
- `GET /u` → scripts/ai-context/cenarios.mjs
- `GET /users` → scripts/ai-context/cenarios.mjs
- `POST /users/:id` → scripts/ai-context/cenarios.mjs
- `GET /x` → scripts/ai-context/cenarios.mjs

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
- `check-health-alerts` — tabelas: contacts, health_alert_settings, health_alerts, interactions; chamada por 1 arquivo(s) do front
- `check-notifications` — tabelas: contact_relatives, contacts, insights, interactions, life_events; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `clear-must-reset-flag` — tabelas: migration_password_reset_log; chamada por 1 arquivo(s) do front
- `client-notifications` — tabelas: alerts, contacts, interactions, life_events, purchase_history; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `connection-anomaly-detector` — tabelas: connection_anomalies, incoming_webhook_logs, incoming_webhooks; chamada por 1 arquivo(s) do front
- `connection-introspect` — tabelas: connection_configs, information_schema.columns, information_schema.tables; chamada por 1 arquivo(s) do front
- `connection-tester` — tabelas: connection_configs, connection_test_logs; chamada por 1 arquivo(s) do front
- `conversation-analyzer` — tabelas: conversation_analyses, conversation_topics_catalog, interactions, reframing_analysis, suggested_life_events; chamada por 2 arquivo(s) do front
- `conversation-coaching-digest` — tabelas: conversation_analyses; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `conversational-search` — tabelas: conversational_search_cache; chamada por 1 arquivo(s) do front
- `crm-automation-monitor` — tabelas: contacts, crm_automation_logs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `cs-health-recalc` — tabelas: alerts, cs_accounts, cs_health_signals; chamada por 0 arquivo(s) do front — **ÓRFÃ**
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
- `evolution-webhook` — tabelas: contacts, interactions, profiles, whatsapp_ingestion_logs, whatsapp_instances, whatsapp_messages; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `external-data` — tabelas: -; chamada por 3 arquivo(s) do front
- `ficha360-conversation-summary` — tabelas: ficha360_conversation_summaries; chamada por 1 arquivo(s) do front
- `firecrawl-scrape` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `forecast-analyzer` — tabelas: deal_forecasts, forecast_quota_settings; chamada por 1 arquivo(s) do front
- `forecast-narrative` — tabelas: deal_forecasts, forecast_periods; chamada por 1 arquivo(s) do front
- `forecast-snapshot-cron` — tabelas: deal_forecasts, forecast_periods, forecast_snapshots; chamada por 0 arquivo(s) do front — **ÓRFÃ**
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
- `lead-score-cron` — tabelas: interactions, lead_score_recompute_queue; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `lead-score-threshold-runner` — tabelas: alerts, contacts, lead_score_threshold_automations, lead_score_threshold_log; chamada por 0 arquivo(s) do front
- `lead-scorer` — tabelas: contacts, intent_signals, interactions, lead_score_recompute_queue, lead_score_rules, lead_score_thresholds, lead_scores; chamada por 1 arquivo(s) do front
- `lux-trigger` — tabelas: lux_intelligence, lux_webhook_config; chamada por 1 arquivo(s) do front
- `lux-webhook` — tabelas: contacts, lux_intelligence; chamada por 0 arquivo(s) do front
- `mcp-server` — tabelas: companies, connection_configs, contacts, deals, interactions, mcp_tool_calls; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `meeting-summary` — tabelas: interactions, meeting_summaries; chamada por 1 arquivo(s) do front
- `mql-evaluator` — tabelas: contacts, mql_classifications, mql_criteria; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `next-best-action` — tabelas: contact_analytical_profiles, contact_next_actions, contacts, interactions, neuro_behavioral_history, whatsapp_messages; chamada por 1 arquivo(s) do front
- `nurturing-runner` — tabelas: interactions, nurturing_executions, nurturing_workflows, tasks; chamada por 1 arquivo(s) do front
- `objection-context-summary` — tabelas: interactions; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `objection-handler` — tabelas: contact_objection_scripts, contacts, crm_objection_intelligence; chamada por 1 arquivo(s) do front
- `phone-validator` — tabelas: phone_validations; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `playbook-generator` — tabelas: sales_playbooks; chamada por 1 arquivo(s) do front
- `playbook-recommender` — tabelas: battle_cards, sales_playbooks; chamada por 1 arquivo(s) do front
- `process-behavioral-regen-queue` — tabelas: behavioral_profile_regen_queue; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `process-webhook-dlq` — tabelas: incoming_webhook_dlq, incoming_webhooks; chamada por 1 arquivo(s) do front
- `retry-behavioral-profile` — tabelas: behavioral_profile_regen_queue; chamada por 1 arquivo(s) do front
- `revops-snapshot-builder` — tabelas: contacts, deal_forecasts, mql_classifications, revops_alerts, revops_snapshots; chamada por 1 arquivo(s) do front
- `rfm-analyzer` — tabelas: contacts, interactions, purchase_history; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `semantic-search` — tabelas: semantic_search_cache; chamada por 1 arquivo(s) do front
- `send-push-notification` — tabelas: push_subscriptions; chamada por 0 arquivo(s) do front
- `send-sms-campaign` — tabelas: contacts, sms_campaign_recipients, sms_campaigns, sms_opt_outs; chamada por 1 arquivo(s) do front
- `sequence-processor` — tabelas: contacts, sequence_email_reservations, sequence_enrollments, sequence_events, sequence_send_log, sequence_steps, sequences; chamada por 1 arquivo(s) do front
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
- `template-success-notifications` — tabelas: alerts, contacts, favorite_templates, profiles, push_subscriptions, trigger_usage_history; chamada por 1 arquivo(s) do front
- `territory-optimization` — tabelas: sales_team_members; chamada por 1 arquivo(s) do front
- `validate-access` — tabelas: access_blocked_log, access_security_settings, geo_allowed_countries, ip_whitelist; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `validation-queue-worker` — tabelas: validation_queue; chamada por 1 arquivo(s) do front, por SQL/cron
- `visual-search` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-agent` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-ai-health` — tabelas: -; chamada por 1 arquivo(s) do front
- `voice-to-text` — tabelas: interactions, whatsapp_messages; chamada por 2 arquivo(s) do front
- `weekly-digest` — tabelas: contacts, interactions, profiles, weekly_report_settings, weekly_reports; chamada por 1 arquivo(s) do front
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
- `check-contact-health-daily` 0 0 * * * (20260509173046_0804c068-faa0-46de-939b-bd5006dc2ba9.sql)
- `cleanup_rpc_perf_samples_daily` 15 3 * * * (20260723154748_e54bdf5c-194f-4d5a-b5af-46c786cfc8ac.sql)
- `cleanup-simulated-alerts-weekly` 0 3 * * 0 (20260713124628_449b2996-71fd-45fe-bd67-a73e8f011a72.sql)
- `mtta-auto-ack-heartbeat-watchdog` */30 * * * * (20260717142132_7f20a3a3-be27-43dd-9546-4993978d4377.sql)
- `mtta-sla-breach-auto-ack-hourly` 7 * * * * (20260715184735_158ce47d-f19e-4371-a652-b6fc4c158271.sql)
- `revalidate-stale-emails` 0 4 * * * (20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql)
- `revalidate-stale-phones` 30 4 * * * (20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql)
- `singu-rodizio-bloqueios` 10 7 * * * (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `singu-rodizio-closer` 0 6 * * 1 (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `singu-rodizio-sdr` 10 6 * * 1 (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `singu-rodizio-segmentar` 0 1 * * * (20260924213115_t213_rodizio_pg_cron_jobs.sql)
- `smart-notify-automation` 0 */4 * * * → edge smart-notify (20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql)
- `validation-queue-drain` */5 * * * * → edge validation-queue-worker (20260417120721_823eaa43-3b8a-4ea7-a046-ad763d7c5f03.sql)

## Integrações externas
- SDKs: ElevenLabs, Supabase, react-query, zod
- hosts mais citados: ai.gateway.lovable.dev, canonical.supabase.co, example.test, api.elevenlabs.io, wa.me, example.invalid, api.firecrawl.dev, singu-v2.vercel.app, test.supabase.co, cdnjs.cloudflare.com, dialogue-diamond.lovable.app, fixture.invalid, instagram.com, provider.example.test, supabase.example.test
- webhooks recebidos: nenhum
- env de integração (só nomes): BITRIX_APPLICATION_TOKEN, BITRIX_CLIENT_ID, BITRIX_CLIENT_SECRET, BITRIX_WEBHOOK_URL, CRON_SECRET, ELEVENLABS_API_KEY, ENRICHLAYER_API_KEY, EVOLUTION_API_KEY, EVOLUTION_API_URL, EVOLUTION_BITRIX_CONNECTOR_URL, EVOLUTION_INSTANCE_NAME, EVOLUTION_WEBHOOK_SECRET, FIRECRAWL_API_KEY, LOVABLE_API_KEY, N8N_LUX_WEBHOOK_URL, TWILIO_API_KEY

## Permissões / papéis
- papéis no código: user (38), system (32), status (30), alert (24), group (18), button (10), img (7), region (5), contact (4), dialog (4), assistant (3), decision_maker (3), meter (3), radio (3), radiogroup (3), admin (2), combobox (2), menuitem (2), menuitemcheckbox (2), navigation (2), note (2), owner (2), service_role (2), agent (1), authenticated (1), banner (1), figure (1), link (1), list (1), main (1), menu (1), presentation (1), progressbar (1), sup (1), tab (1), tablist (1)
- enums de papel: app_role: admin|moderator|user; entity_relationship_role: buyer|manager|owner|decision_maker|influencer|user|sponsor|partner|supplier|subsidiary|parent|employee_of|other; salesperson_role: sdr|closer|hybrid
- guards: src/app/lazyPages.tsx, src/components/auth/MFAGuard.tsx, src/hooks/useAuth.tsx · rotas protegidas: 102 · públicas: /*, /auth, /design-system, /dr/:token, /f/:slug, /lm/:slug, /lp/:slug, /reset-password, /signature/:token, /sso/callback, /status, /survey/:token
- feature flags: FEATURE_X, nova-tela, novo-inbox

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 99 — ex.: /*, /abm, /abm/:id
- componentes_ambiguos: 0
- menu_sem_destino: 6 — ex.: 1º Contato -> primeiro_contato, Fechamento -> fechamento, Negociação -> negociacao
- edges_orfas: 34 — ex.: attribution-calculator, audit-analytics, auto-rebatch-behavioral
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 9 — ex.: audit_log_default, company_addresses, company_emails
- tabelas_usadas_sem_definicao: 4 — ex.: information_schema.columns, information_schema.tables, logs
- tabelas_com_drift_migration_vs_types: 88 — ex.: access_blocked_log, access_security_settings, activities
- rpcs_sem_definicao: 3 — ex.: get_territories, get_territory_performance, increment_workflow_completed
- componentes_orfaos: 44 — ex.: src/components/admin/AccessSecurityManager.tsx, src/components/admin/EmailPipelineStatus.tsx, src/components/admin/SystemHealthWidget.tsx
- componentes_com_nome_duplicado: 106 — ex.: ABM, ABMAccountDetail, ABMCampaigns
- scripts_orfaos: 23 — ex.: scripts/hardening/check-client-tls.sql, scripts/hardening/check-extensions-hardening.sql, scripts/hardening/check-indexes-duplicated.sql
- env_usadas_nao_declaradas: 3 — ex.: DEV, PROD, VITE_APP_VERSION
- ciclos_de_import: 5
- possiveis_segredos_no_codigo: 4 — ex.: scripts/ai-context/cenarios.mjs:102, supabase/functions/_shared/auth_test.ts:61, supabase/functions/_shared/auth_test.ts:68

## Grafo de código (graphify)
- 17192 nós · 27503 arestas · 1916 comunidades · grafo do commit `9e96cb58` (DESATUALIZADO em relação ao HEAD)
- comunidades maiores: Community 0 (285), Community 1 (258), Community 2 (254), Community 3 (250), Community 4 (243), Community 5 (226), Community 6 (205), Community 7 (168), Community 8 (158), Community 9 (150), Community 10 (146), Community 11 (146)
- símbolos mais chamados: useAuth() (src/hooks/useAuth.tsx), getContactBehavior() (src/lib/contact-utils.ts), createTabHandler() (src/lib/tab-utils.ts), json() (supabase/functions/evolution-bitrix-connector/index.ts), jsonError() (supabase/functions/_shared/auth.ts), jsonResponse() (supabase/functions/evolution-webhook/index.ts), useCompanyRelated() (src/hooks/useCompanyRelatedData.ts), callExternalData() (src/lib/externalData.ts), normalizeWeek() (src/components/interactions/insights/weekUtils.ts), authHeaders() (scripts/migration/storage/_lib.ts), fetchAI() (supabase/functions/_shared/fetch-utils.ts), formatCurrency() (src/pages/Pipeline.tsx)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- CHANGELOG.md (42)
- .github/workflows/ci.yml (16)
- supabase/functions/external-data/index.ts (15)
- package.json (14)
- package-lock.json (11)
- src/lib/externalData.ts (10)
- docs/qa/security-definer-audit.md (9)
- src/hooks/useContacts.ts (9)
- tests/rls/security_definer_hardening.sql (8)
- supabase/tests/get_contact_sidebar_by_phone.sql (7)
- .github/workflows/rls-exposure-guard.yml (6)
- RELATORIO_CI.md (6)
- ESTADO_ATUAL.md (5)
- docs/qa/functions-authenticated-allowlist.md (5)
- scripts/rls-matrix/rls-baseline.json (5)

## Workflows
- `ci.yml` — CI (pull_request, push)
- `contexto.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 3-59/10 * * * *)
- `inventario-estado-semanal.yml` — Inventário do estado real (semanal) (schedule, workflow_dispatch; cron 23 10 * * 1)
- `monitoring-lint.yml` — monitoring-lint (pull_request, push)
- `restore-drill.yml` — Teste de restauração lógica (pull_request, workflow_dispatch)
- `rls-exposure-guard.yml` — RLS exposure guard (pull_request, push, schedule, workflow_dispatch; cron 0 6 * * 1)

## Scripts npm
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
- `contexto:indice`: `python3 scripts/regras_negocio/indice.py --repo . --out docs/contexto/00-INDEX.md --remote adm01-debug/Singu_V2 --fonte "banco real=docs/contexto/supabase" --fonte "código=docs/contexto/codigo" --fonte "regras de negócio=docs/contexto/regras"`

## Documentos (raiz e docs/)
- `AGENTS.md` — AGENTS.md — Singu_V2 (223 linhas)
- `ARCHITECTURE.md` — Arquitetura do SINGU CRM (150 linhas)
- `AUDITORIA_COMPLETA_SISTEMA.md` — AUDITORIA COMPLETA DO SISTEMA SINGU CRM v2 (425 linhas)
- `AUDITORIA_SISTEMA.md` — 🔍 AUDITORIA EXAUSTIVA — SINGU CRM (307 linhas)
- `CHANGELOG.md` — Changelog (407 linhas)
- `CLAUDE.md` — CLAUDE.md — Singu_V2 (4 linhas)
- `CONTRIBUTING.md` — Guia de Contribuição — SINGU CRM (179 linhas)
- `ESTADO_ATUAL.md` — ESTADO ATUAL DO SISTEMA — SINGU CRM v2 (372 linhas)
- `FIELD_MAPPING.md` — Mapeamento Campo-a-Campo: Banco Local ↔ Banco Externo (288 linhas)
- `FUNCIONALIDADES_SISTEMA.md` — 📋 SINGU CRM — Levantamento Completo de Funcionalidades (434 linhas)
- `HANDOFF.md` — SINGU CRM — Handoff Document (193 linhas)
- `PENDENCIAS.md` — PENDENCIAS.md — Bloqueios e itens fora do escopo (Singu_V2) (68 linhas)
- `PLANEJADO_NAO_EXECUTADO.md` — PLANEJADO × EXECUTADO — SINGU CRM v2 (637 linhas)
- `README.md` — SINGU CRM (193 linhas)
- `RELATORIO_CI.md` — RELATORIO_CI.md — Correção dos workflows com falha (Singu_V2) (123 linhas)
- `audit_report.md` — 🔍 RELATÓRIO DE AUDITORIA ENTERPRISE — SINGU CRM (88 linhas)
- `docs/ARCHITECTURE.md` — SINGU CRM — Arquitetura Consolidada (123 linhas)
- `docs/AUDIT_VALIDATION_23_10.md` — Rodada 23/10 — Validação Exaustiva dos Guards (11–22) (188 linhas)
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
- `docs/RUNBOOK.md` — SINGU CRM — Runbook Operacional (686 linhas)
- `docs/SECURITY.md` — SINGU CRM — Política de Segurança (83 linhas)
- `docs/SIGNING_KEY_ROTATION.md` — Signing Key Rotation Runbook (79 linhas)
- `docs/SYSTEM_EXCELLENCE_10_10.md` — 🏆 SINGU CRM — Estado de Excelência Técnica 10/10 (41 linhas)
- `docs/TECH_DEBT.md` — 🚩 TECH DEBT BACKLOG — SINGU CRM (46 linhas)
- `docs/audit_report.md` — 🔍 RELATÓRIO DE AUDITORIA ENTERPRISE — SINGU CRM (88 linhas)
- `docs/data-dictionary.md` — 📖 Dicionário de Dados — SINGU CRM (4488 linhas)
- `docs/er-diagram.md` — 📊 Diagrama Entidade-Relacionamento (ER) (8 linhas)
- `docs/postmortem-example.md` — Post-Mortem — Indisponibilidade parcial do salvamento de contatos (external-data) (99 linhas)
- `docs/postmortem-template.md` — Post-Mortem — {Título do Incidente} (96 linhas)
- `docs/ux_improvement_strategy.md` (73 linhas)
- subpastas de docs/: docs/adr (25), docs/lacunas (17), docs/estado (12), docs/auditoria (8), docs/qa (8), docs/contexto (2), docs/dr (2), docs/dr-drills (2), docs/runbooks (2), docs/agentes (1), docs/perf (1)
- CHANGELOG topo: [Unreleased]

## Últimos commits
- 2026-11-08 `de99442c` feat(inventario): inventário semanal do estado real do banco e das edges, com PR automática (#170)
- 2026-11-08 `77990bc3` feat(contexto): produtores autônomos que mantêm o estado real do repositório para agentes de IA (#169)
- 2026-11-08 `01fc3928` fix(ci): corrige YAML fatal do CI, secret fantasma e portabilidade dos gate tests (#164)
- 2026-11-07 `3e4b9701` feat: teste de auditoria de cobertura RLS (check-rls-coverage.sql) (#168)
- 2026-11-07 `ab7efa8e` feat: scripts de verificação de índices/perf e hardening (auditoria read-only) (#167)
- 2026-11-07 `f0aea23a` fix: corrige cast inválido de active_pid no replication-slot-idle-guard (#165)
- 2026-11-07 `d8475aa3` fix: qualifica digest() com schema extensions no schema-freeze-guard (#166)
- 2026-11-06 `f665f675` fix(ci): remove script injection no step de validação do título da PR (#162)
- 2026-11-06 `d00de592` fix(ci): corrige corrupção de texto nos workflows restore-drill e rls-exposure-guard (#161)
- 2026-11-06 `b911f821` chore: sobe actions/checkout para v5 nos workflows de monitoramento, restore e RLS (#160)
- 2026-11-06 `92d94662` chore: sobe actions/checkout para v5 no ci.yml (#159)
- 2026-11-06 `cf83f3a4` fix(ci): baseline SECURITY DEFINER 109 → 110 (guard_contact_relation_write) (#158)
- 2026-11-05 `738a2a40` fix(webhook): preserva timestamps textuais do Evolution (#157)
- 2026-11-05 `8ed532a9` chore: atualizar AGENTS.md com texto mestre
- 2026-11-05 `36786632` build(deps): bump minor-and-patch dependencies

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
