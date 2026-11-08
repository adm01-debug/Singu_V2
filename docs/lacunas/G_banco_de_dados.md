# G — Camada de banco: funcionalidades planejadas e não executadas

**Repositório:** `/home/user/Singu_V2` · **HEAD:** `e616c20` (2026-10-11) · **Migrations:** 447 arquivos em `supabase/migrations/`
**Escopo:** schema declarado nas migrations × consumo real em `src/`, `supabase/functions/`, funções/triggers SQL e `pg_cron`.

## Método e limites (ler antes)

- **Parser próprio.** Comentários SQL (`--` e `/* */`) foram removidos preservando strings, corpos `$$` e numeração de linha. O estado final foi obtido reexecutando, na ordem dos arquivos, `CREATE`/`DROP`/`ALTER … RENAME` de tabelas, views, MVs, funções, triggers e policies. DDL montado em tempo de execução (`EXECUTE format(...)`) **não entra na contagem** (6 `CREATE POLICY` via `format()` e partições dinâmicas ficaram de fora).
- **"Vivo" vs "morto".** Um arquivo de `src/` é *vivo* se é alcançável a partir de `src/main.tsx` pelo grafo de imports (1.497 de 1.631 arquivos não-teste). A página `src/pages/admin/Observability.tsx` foi excluída porque o lazy `AdminObservability` (`src/app/lazyPages.tsx:3`) não é usado em `src/app/AppRoutes.tsx`. Uma edge function é *viva* se é invocada por arquivo vivo ou por outra edge, ou se é webhook externo. É *gated* se chama `requireCronSecret` sem caminho alternativo (`supabase/functions/_shared/auth.ts:237-247`).
- **Função SQL "viva"** é aquela chamada por front/edge, por trigger, por cron, ou por outra função viva.
- **Estado de produção NÃO É VERIFICÁVEL daqui.** Nenhuma consulta foi feita ao banco canônico (`pgxfvjmuubtbowutlide`). Tudo o que está abaixo é estático: o que o repositório declara. Onde o repositório se contradiz, isso aparece como `NAO_VERIFICADO`.
- **Há duas linhagens de schema.** As migrations descrevem o banco "Lovable" (CRM relacional e inteligência). O banco canônico também tem um segundo schema, de cadastro, faturamento e transportadoras (`customers`, `users`, `company_phones`, `config_regras_negocio`, `carriers`…), que **não tem DDL no repositório**. As próprias migrations recentes reconhecem isso (seção "Lacunas declaradas…").
- Auditoria anterior para comparação: `ESTADO_ATUAL.md:52`, feita com 390 migrations: 265 tabelas, 210 funções, 250 triggers, 1.061 políticas e 15 jobs.


> **Conferência de linhas:** foram reconferidas as citações de `authenticated_least_privilege.sql`, `20260509184703`, `20261006120000:87-89` e `20260723150429:33`, além de todas as linhas geradas automaticamente pelo parser. As demais referências manuais foram extraídas das saídas do parser e de `grep` nesta sessão, mas **NÃO RECONFERIDAS** individualmente depois da redação. Destaque para as faixas aproximadas: `20260924153509_…sql:1-77`, `src/hooks/useConnectionAnomalies.ts:45-73` e `20261006120000_…sql:93-160`.

## Inventário

| Objeto | Comandos `CREATE` (brutos) | Nomes distintos criados | **Estado final** | Removidos ao fim | Observação |
|---|---:|---:|---:|---:|---|
| Tabelas | 288 | 271 | **271** (270 `public` + `ops_backup.acl_snapshot`) | 0 | 4 tabelas foram dropadas e recriadas, ver abaixo |
| Views | 36 | 20 | **20** | 0 | 9 sem consumidor (ver "Funções…/Views") |
| Materialized views | 0 | 0 | **0 criadas no repo** | — | `mv_daily_kpis` e `mv_daily_stats` só são **movidas** para `reporting` (`20260721000055_…sql:25-26`); foram criadas fora do repositório |
| Funções/procedures | 393 | 281 | **277** (todas em `public`) | 10 | 4 criadas e depois dropadas; 6 dropadas sem nunca terem sido criadas no repo (`20260924213226_t214_…sql:19-25`) |
| Triggers | 218 | 213 | **194** (192 em `public`, 2 em `auth.users`) | 19 | |
| Policies RLS | 851 | 813 | **775** (750 `public`, 23 `storage`, 1 `realtime`, 1 `zapp_history`) | 48 | Em 269 tabelas; `ALTER POLICY` das ondas `wave_rls_initplan_*` só reescreve expressões |
| Tipos (enum) | 10 | 10 | 10 | 0 | `app_role` em `20260323155106_…sql:3` |
| Schemas criados | 3 | — | `extensions`, `ops_backup`, `reporting` | — | |
| Índices (`CREATE INDEX`) | 496 | — | — | — | 14 índices recaem sobre tabelas sem `CREATE TABLE` no repo |
| **Jobs `pg_cron`** | 19 `cron.schedule` distintos | 19 | **19** | 0 desagendados em definitivo | Os `cron.unschedule` existentes servem só para reagendar de forma idempotente |

**Tabelas dropadas e recriadas** (nenhuma termina dropada):
- `deals`: dropada em `20260317213904_…sql:1`, recriada em `20260512184042_…sql:24`.
- `pipeline_stage_transitions`: dropada em `20260513164309_…sql:2`, recriada no mesmo arquivo (`:4`) e em `20260513165148_…sql:2`.
- `audit_log`: dropada em `20260711152812_…sql:6`, recriada particionada (`:8`), com `audit_log_default` em `:75`.
- `ai_gateway_metrics`: dropada em `20260723154109_…sql:3`, recriada (`:5`) e de novo em `20261006140000_…sql:7`.

**Views dropadas e recriadas:** `push_subscriptions_safe` (`20260405111331_…:3`), `v_life_events_audit` (`20260511141823_…:1`), `v_contact_behavior_audit` (`20260511193130_…:11`), `v_contact_personality_audit` (`20260522142751_…:38`), `forms_public`, `landing_pages_public`, `csat_surveys_public`, `document_signatures_public` e `vw_contacts_nlp` (`20260522142957_…:35-59`). Todas existem no estado final.

**Variação desde a auditoria anterior:** +57 migrations (390 → 447). Entraram o rodízio de carteira (`20260924153441…20260927120000`), as RPCs Multiplix (`20260926133544…135318`), as ondas `wave_rls_initplan_batch1..9` e as migrations "canônicas" de outubro.

**Objetos sem DDL no repositório que o próprio repositório usa** (a linhagem estrangeira):
- Funções das migrations leem tabelas que não existem em nenhuma migration. Exemplos: `customers` (26 funções), `company_addresses` (11), `config_regras_negocio` (11), `users` (11), `customer_events` (7), `contact_phones` (6), `reminders` (4), `sdr_closer_assignments` (3). Todas existem só em `src/integrations/supabase/types.ts`, gerado do canônico.
- 57 relações lidas pelo front vivo existem só no canônico. Exemplos: `vw_singu_contact_360` (`src/hooks/useContactView360.ts:47`), `proposals` (`src/hooks/useContactProposals.ts:28`), `meetings` (`src/hooks/useContactMeetings.ts:29`), `config_regras_negocio` (`src/hooks/useRodizioEquipe.ts:99`), `users` (`src/hooks/useRodizioEquipe.ts:77`).
- Policies sobre `public.users` e `public.product_novelties`, e 14 índices sobre tabelas sem DDL no repo (`cadence_enrollments`, `reminders`, `sales_opportunities`, `supplier_score_history`…).
- `types.ts` (em uso) tem 266 tabelas e 111 views, **146 tabelas não estão nas migrations** e **declara 0 RPCs** (`src/integrations/supabase/types.ts:16608-16610`). `git log` desse arquivo tem um único commit (`c9b22b5`, 2026-08-04).

## Tabelas sem consumidor (por domínio)

### Visão por domínio

Legenda dos códigos `[XY]`: X = escritor (`W` vivo, `w` só em caminho morto, `-` nenhum) e Y = leitor (`R` vivo, `r` só morto, `-` nenhum). Escritores incluem `.insert/.upsert/.update/.delete` no front e nas edge functions, e `INSERT/UPDATE/DELETE` em funções SQL. Leitores incluem `.select`, `queryExternalData` e referências em funções e views. Seeds de migration **não** contam como produtor.

| Domínio | Tabelas | Leitura+escrita vivas | Sem produtor vivo | Sem leitor vivo | Tabelas citadas em teste SQL | Tabelas com problema |
|---|---|---|---|---|---|---|
| ABM | 5 | 5 | 0 | 0 | 0 | — |
| Customer Success/NPS/CSAT | 6 | 6 | 0 | 0 | 2 | — |
| RevOps | 3 | 2 | 1 | 0 | 0 | `revops_snapshots`[wR] |
| Forecast | 5 | 3 | 1 | 1 | 1 | `forecast_categories_history`[W-] `forecast_snapshots`[wR] |
| Intent | 3 | 3 | 0 | 0 | 0 | — |
| Deal Rooms | 6 | 6 | 0 | 0 | 6 | — |
| Conversation Intelligence | 10 | 7 | 1 | 2 | 1 | `call_logs`[-R] `interaction_summaries`[--] `whatsapp_transcriptions`[W-] |
| Marketing (forms/LP/magnets/campanhas/atribuição/MQL/nurturing) | 17 | 13 | 1 | 3 | 9 | `attribution_models_cache`[W-] `marketing_campaign_stats`[-R] `marketing_roi_data`[--] `nurturing_enrollments`[--] |
| SMS | 4 | 2 | 1 | 1 | 0 | `sms_campaign_recipients`[wR] `sms_opt_outs`[-r] |
| Sequências | 5 | 5 | 0 | 0 | 0 | — |
| Lead scoring | 9 | 8 | 1 | 0 | 1 | `lead_score_config`[-R] |
| Win/Loss, playbooks, battle cards | 7 | 7 | 0 | 0 | 0 | — |
| Roteamento de leads / Rodízio | 9 | 1 | 1 | 7 | 0 | `customer_purchases`[Wr] `handoff_requests`[--] `lead_assignments`[--] `lead_routing_rules`[--] `redistribution_log`[--] `rodizio_distribuicao_staging`[W-] `rodizio_execucoes`[W-] `sales_team_members`[wR] |
| Pipeline/Deals | 4 | 1 | 1 | 2 | 1 | `pipeline_stage_transitions`[-R] `pipeline_stages`[-r] `pipelines`[--] |
| Enriquecimento/validação | 5 | 5 | 0 | 0 | 0 | — |
| Conexões/Webhooks/MCP | 9 | 5 | 0 | 4 | 0 | `connection_anomalies`[wr] `incoming_webhook_dlq`[Wr] `incoming_webhook_nonces`[W-] `mcp_tool_calls`[W-] |
| Observabilidade/Admin | 17 | 12 | 0 | 5 | 9 | `ai_recommendation_audit_logs`[-r] `ai_recommendation_logs`[--] `audit_log_default`[--] `cron_secrets`[-r] `data_retention_policies`[W-] |
| Segurança/Acesso | 13 | 6 | 3 | 4 | 2 | `access_blocked_log`[W-] `city_whitelist`[--] `device_login_notifications`[W-] `login_attempts`[--] `permissions`[-R] `role_permissions`[-R] `user_roles`[-R] |
| Notificações/Alertas | 11 | 9 | 0 | 2 | 0 | `notification_logs`[wr] `notifications`[wr] |
| Documentos/Assinaturas | 4 | 3 | 0 | 1 | 2 | `document_views`[W-] |
| Suporte/KB | 4 | 4 | 0 | 0 | 0 | — |
| RFM | 4 | 2 | 2 | 0 | 0 | `rfm_metrics`[-R] `rfm_segment_config`[-R] |
| WhatsApp | 5 | 2 | 2 | 1 | 1 | `whatsapp_ingestion_logs`[W-] `whatsapp_kpis`[-R] `whatsapp_messages_index`[-R] |
| Neuromarketing (gatilhos) | 5 | 1 | 4 | 0 | 0 | `trigger_ab_tests`[-R] `trigger_bundles`[-R] `trigger_channel_effectiveness`[-R] `trigger_intensity_history`[-R] |
| Social | 7 | 5 | 1 | 1 | 1 | `social_insights`[-R] `social_scraping_schedule`[Wr] |
| Comportamental/NLP/DISC/Neuro | 37 | 22 | 7 | 8 | 13 | `brain_dominance_analysis`[-r] `cognitive_bias_history`[wR] `contact_analytical_profile_versions`[wR] `contact_objection_scripts`[Wr] `disc_analysis_history_audit`[W-] `disc_communication_logs`[Wr] `disc_conversion_metrics`[-R] `disc_profile_config`[--] `eq_analysis_history`[-R] `hidden_objections`[-R] `neuro_behavioral_history`[-R] `neuro_pnl_sessions`[--] `nlp_feedback`[--] `psychographic_audit_log`[wR] `reframing_analysis_audit`[W-] |
| Core CRM / outros | 56 | 36 | 8 | 12 | 7 | `activities`[W-] `automation_logs`[-R] `client_values`[-R] `communication_preferences`[wR] `contact_cadence_audit`[W-] `contact_preferences_audit`[W-] `contact_relatives_audit`[W-] `contact_time_analysis`[-R] `contact_time_analysis_audit`[W-] `crm_automation_reprocess_queue`[W-] `crm_consent_audit_logs`[-r] `crm_metric_overrides`[W-] `decision_criteria`[-R] `follow_up_approvals`[w-] `follow_up_approvals_v2`[W-] `interactions_audit`[W-] `life_events_history`[W-] `purchase_history`[-R] `search_products_cache`[-R] `weekly_reports`[wR] |

**Leitura por domínio pedido (o que o schema planejou e a aplicação não entregou):**

- **ABM** (`abm_*`, 5 tabelas): CRUD vivo em `src/hooks/useABM.ts`, mais scorer e whitespace (`supabase/functions/abm-account-scorer/index.ts:125`, `abm-whitespace-analyzer/index.ts:164`). Não falta app. **Falta teste SQL (0 de 5).**
- **Customer Success / NPS / CSAT** (`cs_*`, `csat_surveys`): o CRUD é manual pelo front (`src/hooks/useCustomerSuccess.ts:139-384`). O recálculo automático de saúde, `cs-health-recalc`, tem gate de cron (`supabase/functions/cs-health-recalc/index.ts:7`) e **nenhum agendador**. `record_nps_response` (`20260721000077_…sql:449`) não tem chamador e grava em `nps_surveys`, tabela que só existe no canônico. 🟨/⏰
- **RevOps** (`revops_*`): `revops_snapshots` é lida pelo front (`src/hooks/useRevOps.ts:74`), mas o único produtor é `revops-snapshot-builder`, com gate e sem agendador (`supabase/functions/revops-snapshot-builder/index.ts:20`). O botão do front recebe 401. ⏰
- **Forecast**: `forecast_snapshots` é lida (`src/hooks/useForecasting.ts:195`) e só é produzida por `forecast-snapshot-cron`, com gate e sem agendador (`supabase/functions/forecast-snapshot-cron/index.ts:8`). `forecast_categories_history` é só escrita (trigger `log_deal_forecast_category_change`). ⏰
- **Intent**: pixel, agregador e scores estão vivos (`intent-tracker/index.ts:95`, `intent-aggregator/index.ts:115`). Não falta app. 0 teste SQL.
- **Deal Rooms**: completo (CRUD, RPCs por token e `tests/rls/deal_rooms_share_token.sql`). Ressalva: `seed_deal_room` (`20260417003149_…sql:131`) não tem chamador.
- **Conversation Intelligence**: `call_logs` é lida (`src/hooks/useUnifiedHistory.ts:125`) **sem nenhum produtor**, porque não há integração de telefonia. `interaction_summaries` é morta. `whatsapp_transcriptions` é só escrita. 🔌
- **Marketing** (forms, LP, magnets, campanhas, atribuição, MQL, nurturing): o lado público funciona por RPC (`submit_public_form`, `track_magnet_download`). Estão quebrados (detalhes em G09 e G20):
  - **o envio de campanhas de e-mail é simulado** (`src/hooks/useEmailCampaigns.ts:84-85`: "Simula o envio (não dispara emails reais…)"), e nenhuma edge function lê `email_campaigns`/`campaign_recipients`;
  - `marketing_campaign_stats` é lida (`src/hooks/useMarketingInsights.ts:109`) sem produtor;
  - `marketing_roi_data` e `nurturing_enrollments` são mortas;
  - `nurturing-runner` tem gate e não é agendado.
- **SMS** (`sms_*`): `send-sms-campaign` tem gate (`supabase/functions/send-sms-campaign/index.ts:27`). O front a chama (`src/hooks/useSmsCampaigns.ts:106`) e recebe 401. `sms_opt_outs` **não tem nenhum escritor**: não há como registrar opt-out. ⏰/❌
- **Landing pages**: anon pode ler e fazer insert (`20261006120000_…sql:76-80`) e `increment_landing_page_view` foi criada em outubro (`20261006120000_…sql:12`). OK no schema.
- **Roteamento de leads legado** (`lead_routing_rules`, `lead_assignments`, `handoff_requests`, `redistribution_log`): mortos, substituídos pelo rodízio (`src/types/rodizio.ts:5-6`). ⬛
- **Neuromarketing**: os 4 analíticos `trigger_*` são lidos (`src/hooks/useTriggerAnalytics.ts:13-25`) e **nunca escritos**. 🔌
- **Comportamental**: `eq_analysis_history`, `hidden_objections`, `neuro_behavioral_history`, `disc_conversion_metrics`, `client_values`, `decision_criteria` e `contact_time_analysis` são lidas e não têm produtor. `cognitive_bias_history` e `communication_preferences` só são escritas por hooks mortos. 🔌

### Listas por categoria (com evidência)


#### A. Sem nenhum leitor nem escritor (⬛ MORTO) — 15

| Tabela | Domínio | Criada em | Leitores vivos | Escritores (vivos / mortos) |
|---|---|---|---|---|
| `ai_recommendation_logs` | Observabilidade/Admin | `supabase/migrations/20260509115357_40a94b7c-1a20-49cd-b0a7-53f4d35ab3af.sql:2` | — | vivos: — / mortos: — |
| `audit_log_default` | Observabilidade/Admin | `supabase/migrations/20260711152812_6c39e481-8892-4747-9d27-144b71b055e4.sql:75` | — | vivos: — / mortos: — |
| `city_whitelist` | Segurança/Acesso | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql:45` | — | vivos: — / mortos: — |
| `disc_profile_config` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260124184935_7462f0ba-52a4-4ded-a9a4-316446a8223f.sql:48` | — | vivos: — / mortos: — |
| `handoff_requests` | Roteamento de leads / Rodízio | `supabase/migrations/20260415233816_bf8ddb84-c73e-4d23-a2b0-c3c0f8fdfcc8.sql:159` | — | vivos: — / mortos: — |
| `interaction_summaries` | Conversation Intelligence | `supabase/migrations/20260512132827_7f60209b-d5d6-49bb-80d5-117e8298aea5.sql:30` | — | vivos: — / mortos: — |
| `lead_assignments` | Roteamento de leads / Rodízio | `supabase/migrations/20260415233816_bf8ddb84-c73e-4d23-a2b0-c3c0f8fdfcc8.sql:107` | — | vivos: — / mortos: — |
| `lead_routing_rules` | Roteamento de leads / Rodízio | `supabase/migrations/20260415233816_bf8ddb84-c73e-4d23-a2b0-c3c0f8fdfcc8.sql:61` | — | vivos: — / mortos: — |
| `login_attempts` | Segurança/Acesso | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql:18` | — | vivos: — / mortos: — |
| `marketing_roi_data` | Marketing (forms/LP/magnets/campanhas/atribuição/MQL/nurturing) | `supabase/migrations/20260512175533_60e5a2d8-6ef2-428b-8a15-4a3c550f2003.sql:30` | — | vivos: — / mortos: — |
| `neuro_pnl_sessions` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260511204700_6ffd9ae7-4ef1-4244-88ba-babdb95dbba0.sql:25` | — | vivos: — / mortos: — |
| `nlp_feedback` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260511200945_d86acef4-cdef-4e40-8420-4610dffa9a89.sql:16` | — | vivos: — / mortos: — |
| `nurturing_enrollments` | Marketing (forms/LP/magnets/campanhas/atribuição/MQL/nurturing) | `supabase/migrations/20260416110653_39ecceba-43ea-409e-8b70-b83376e9e57f.sql:17` | — | vivos: — / mortos: — |
| `pipelines` | Pipeline/Deals | `supabase/migrations/20260512184042_fccf5358-81d7-4eae-9083-d92055f150d1.sql:2` | — | vivos: — / mortos: — |
| `redistribution_log` | Roteamento de leads / Rodízio | `supabase/migrations/20260415233816_bf8ddb84-c73e-4d23-a2b0-c3c0f8fdfcc8.sql:211` | — | vivos: — / mortos: — |

#### B. Lidas por tela viva, mas sem nenhum produtor no repositório (🔌 painel sem produtor) — 26

| Tabela | Domínio | Criada em | Leitores vivos | Escritores (vivos / mortos) |
|---|---|---|---|---|
| `automation_logs` | Core CRM / outros | `supabase/migrations/20260317195052_91a69f5c-0ce8-4b32-be8d-cf6d9ccb9151.sql:52` | `src/hooks/useAutomationRules.ts:124` | vivos: — / mortos: — |
| `call_logs` | Conversation Intelligence | `supabase/migrations/20260509170538_45b95e4b-470c-4067-af3c-7502d9b60532.sql:2` | `src/hooks/useUnifiedHistory.ts:125`, `src/hooks/useEvidenceForLabel.ts:54` | vivos: — / mortos: `supabase/functions/generate-behavioral-profile/index.ts:104` (generate-behavioral-profile: gated) |
| `client_values` | Core CRM / outros | `supabase/migrations/20260111130846_783060ff-715f-4433-b3e4-1c0ef5409533.sql:29` | `src/components/crm/commercial/ClientValuesElite.tsx:32`, `src/hooks/useNLPAnalyticsData.ts:84`, `src/hooks/usePreContactBriefing.ts:185` | vivos: — / mortos: — |
| `contact_time_analysis` | Core CRM / outros | `supabase/migrations/20260111183305_a7554561-ed71-4a77-a1b5-2ad2436f5356.sql:52` | `src/hooks/useContactTimeAnalysis.ts:27`, `src/hooks/useContactRelationalData.ts:131` | vivos: — / mortos: fn `get_best_contact_times` |
| `decision_criteria` | Core CRM / outros | `supabase/migrations/20260111130846_783060ff-715f-4433-b3e4-1c0ef5409533.sql:45` | `src/components/crm/commercial/DecisionCriteriaElite.tsx:41` | vivos: — / mortos: fn `get_contact_sidebar_by_phone` |
| `disc_conversion_metrics` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260124184935_7462f0ba-52a4-4ded-a9a4-316446a8223f.sql:93` | `src/hooks/useDISCConversionMetrics.ts:18` | vivos: — / mortos: — |
| `eq_analysis_history` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260111162422_931d8ea9-50f0-4793-b167-51ddb862bc64.sql:2` | `src/components/lead-score/LeadScoreWidget.tsx:38`, `src/components/contact-detail/ContactBehavioralTab.tsx:78` | vivos: — / mortos: — |
| `hidden_objections` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260111130846_783060ff-715f-4433-b3e4-1c0ef5409533.sql:59` | `src/components/lead-score/LeadScoreWidget.tsx:43`, `src/components/contact-detail/ContactIntelligenceTab.tsx:64`, `src/hooks/useNLPAnalyticsData.ts:85` | vivos: — / mortos: — |
| `lead_score_config` | Lead scoring | `supabase/migrations/20260416005302_557a4633-8c05-46e2-9b4a-31f1341c9540.sql:58` | `src/hooks/useLeadScore.ts:276`, `src/hooks/useLeadScore.ts:307` | vivos: — / mortos: — |
| `marketing_campaign_stats` | Marketing (forms/LP/magnets/campanhas/atribuição/MQL/nurturing) | `supabase/migrations/20260512175533_60e5a2d8-6ef2-428b-8a15-4a3c550f2003.sql:2` | `src/hooks/useMarketingInsights.ts:109` | vivos: — / mortos: — |
| `neuro_behavioral_history` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260511210108_aa50bc4d-c2a8-4cb3-b641-3280c677cd05.sql:2` | `src/components/crm/behavior/NeuromarketingTimeline.tsx:35`, `src/components/contact-detail/NeuroEvolutionChart.tsx:21`, `src/hooks/useUnifiedTimeline.ts:66` | vivos: — / mortos: — |
| `permissions` | Segurança/Acesso | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql:146` | `src/pages/PermissionsPage.tsx:17` | vivos: — / mortos: — |
| `pipeline_stage_transitions` | Pipeline/Deals | `supabase/migrations/20260513143103_c834a03b-5b1e-41c7-a213-eea176782e00.sql:2` | fn `fn_validate_deal_stage_transition`, fn `move_deal_atomic` | vivos: — / mortos: — |
| `purchase_history` | Core CRM / outros | `supabase/migrations/20260111183305_a7554561-ed71-4a77-a1b5-2ad2436f5356.sql:2` | `src/components/crm/commercial/PurchaseHistoryElite.tsx:27`, `src/components/contact-detail/ContactCommercialTab.tsx:55`, `src/hooks/usePurchasePatterns.ts:55` | vivos: — / mortos: `supabase/functions/client-notifications/index.ts:69` (client-notifications: gated) |
| `rfm_metrics` | RFM | `supabase/migrations/20260124180842_985d82f1-0e31-443c-8d84-c7ab79bc4e10.sql:100` | `src/hooks/useRFMSegmentConfig.ts:14` | vivos: — / mortos: — |
| `rfm_segment_config` | RFM | `supabase/migrations/20260124180842_985d82f1-0e31-443c-8d84-c7ab79bc4e10.sql:70` | `src/hooks/useRFMSegmentConfig.ts:13` | vivos: — / mortos: — |
| `role_permissions` | Segurança/Acesso | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql:159` | `src/pages/RolePermissionsPage.tsx:16` | vivos: — / mortos: `src/hooks/useRBAC.tsx:38` (arquivo morto) |
| `search_products_cache` | Core CRM / outros | `supabase/migrations/20260416181200_6d3557ca-038e-4e4c-b64e-bc3a706f929f.sql:6` | fn `search_products_semantic` | vivos: — / mortos: — |
| `social_insights` | Social | `supabase/migrations/20260720000023_create_phantom_tables.sql:95` | `src/hooks/useSocialInsights.ts:48`, `supabase/functions/generate-offer-suggestions/index.ts:82` (generate-offer-suggestions: viva) | vivos: — / mortos: — |
| `trigger_ab_tests` | Neuromarketing (gatilhos) | `supabase/migrations/20260125155610_a5f0704f-a377-42c0-8849-bc49b5254e28.sql:7` | `src/hooks/useTriggerAnalytics.ts:13`, `src/hooks/useTriggerAnalytics.ts:14` | vivos: — / mortos: — |
| `trigger_bundles` | Neuromarketing (gatilhos) | `supabase/migrations/20260125155610_a5f0704f-a377-42c0-8849-bc49b5254e28.sql:70` | `src/hooks/useTriggerAnalytics.ts:23` | vivos: — / mortos: — |
| `trigger_channel_effectiveness` | Neuromarketing (gatilhos) | `supabase/migrations/20260125155610_a5f0704f-a377-42c0-8849-bc49b5254e28.sql:53` | `src/hooks/useTriggerAnalytics.ts:17`, `src/hooks/useTriggerAnalytics.ts:18` | vivos: — / mortos: — |
| `trigger_intensity_history` | Neuromarketing (gatilhos) | `supabase/migrations/20260125155610_a5f0704f-a377-42c0-8849-bc49b5254e28.sql:40` | `src/hooks/useTriggerAnalytics.ts:25` | vivos: — / mortos: — |
| `user_roles` | Segurança/Acesso | `supabase/migrations/20260323155106_4e591bd9-2acd-4735-a4f7-2f6008e560f8.sql:5` | `src/pages/RolesPage.tsx:17`, `supabase/functions/ask-crm/index.ts:170` (ask-crm: viva), fn `has_role` | vivos: — / mortos: `src/hooks/useRBAC.tsx:21` (arquivo morto), fn `merge_duplicate_companies`, fn `merge_contacts` |
| `whatsapp_kpis` | WhatsApp | `supabase/migrations/20260305204447_d9a65b36-83ab-434e-9699-aac2341f11e1.sql:48` | `src/hooks/useWhatsAppData.ts:14` | vivos: — / mortos: — |
| `whatsapp_messages_index` | WhatsApp | `supabase/migrations/20260511204700_6ffd9ae7-4ef1-4244-88ba-babdb95dbba0.sql:50` | `src/components/whatsapp/WhatsAppDashboard.tsx:23` | vivos: — / mortos: — |

#### C. Lidas por tela viva, produtor só em caminho morto (⏰ edge com gate de cron sem agendador / hook morto) — 9

| Tabela | Domínio | Criada em | Leitores vivos | Escritores (vivos / mortos) |
|---|---|---|---|---|
| `cognitive_bias_history` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260111162422_931d8ea9-50f0-4793-b167-51ddb862bc64.sql:32` | `src/components/contact-detail/ContactBehavioralTab.tsx:83` | vivos: — / mortos: `src/hooks/useCognitiveBiasPersistence.ts:93` (arquivo morto), `src/hooks/useCognitiveBiasPersistence.ts:61` (arquivo morto) |
| `communication_preferences` | Core CRM / outros | `supabase/migrations/20260111183305_a7554561-ed71-4a77-a1b5-2ad2436f5356.sql:18` | `src/hooks/useCompanyProfileAnalytics.ts:148`, `src/hooks/useContactRelationalData.ts:130` | vivos: — / mortos: `src/hooks/useCommunicationPreferences.ts:34` (arquivo morto), `src/hooks/useCommunicationPreferences.ts:41` (arquivo morto), `src/hooks/useCommunicationPreferences.ts:17` (arquivo morto) |
| `contact_analytical_profile_versions` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260712221944_e2a7b947-777b-4eaf-8ea4-fe2e542d605e.sql:2` | `src/hooks/useBehavioralProfileVersions.ts:52` | vivos: — / mortos: `supabase/functions/generate-behavioral-profile/index.ts:245` (generate-behavioral-profile: gated) |
| `forecast_snapshots` | Forecast | `supabase/migrations/20260417001337_e3b9438d-89c9-4f77-a877-8feab6e00231.sql:61` | `src/hooks/useForecasting.ts:195` | vivos: — / mortos: `supabase/functions/forecast-snapshot-cron/index.ts:51` (forecast-snapshot-cron: gated) |
| `psychographic_audit_log` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260512151247_371fdb19-5fa5-459c-87d3-7bbac407fd35.sql:18` | `src/hooks/commercial/useSocialSync.ts:35` | vivos: — / mortos: `supabase/functions/sync-social-interests/index.ts:50` (sync-social-interests: gated) |
| `revops_snapshots` | RevOps | `supabase/migrations/20260417105530_03a1c9e4-218e-4962-a9e5-145c3627b96c.sql:4` | `src/hooks/useRevOps.ts:74` | vivos: — / mortos: `supabase/functions/revops-snapshot-builder/index.ts:162` (revops-snapshot-builder: gated), `supabase/functions/revops-snapshot-builder/index.ts:80` (revops-snapshot-builder: gated) |
| `sales_team_members` | Roteamento de leads / Rodízio | `supabase/migrations/20260415233816_bf8ddb84-c73e-4d23-a2b0-c3c0f8fdfcc8.sql:7` | `src/hooks/useTeamDashboard.ts:26`, `supabase/functions/territory-optimization/index.ts:224` (territory-optimization: viva) | vivos: — / mortos: fn `reset_daily_lead_counts`, fn `get_team_member_ids` |
| `sms_campaign_recipients` | SMS | `supabase/migrations/20260416200246_1d21f8b8-a860-4bc1-a79b-6bc3f319f128.sql:40` | `src/hooks/useSmsCampaigns.ts:154` | vivos: — / mortos: `supabase/functions/send-sms-campaign/index.ts:99` (send-sms-campaign: gated), `supabase/functions/send-sms-campaign/index.ts:121` (send-sms-campaign: gated), `supabase/functions/send-sms-campaign/index.ts:163` (send-sms-campaign: gated) |
| `weekly_reports` | Core CRM / outros | `supabase/migrations/20260111182124_be853165-a33d-4677-93dd-3ea9ebd15b45.sql:38` | `src/hooks/useWeeklyReport.ts:121` | vivos: — / mortos: `supabase/functions/weekly-digest/index.ts:204` (weekly-digest: gated) |

#### D. Só leitura/escrita em caminho morto (⬛) — 10

| Tabela | Domínio | Criada em | Leitores vivos | Escritores (vivos / mortos) |
|---|---|---|---|---|
| `ai_recommendation_audit_logs` | Observabilidade/Admin | `supabase/migrations/20260509115734_ef006f0a-d94e-43d2-9b73-a1760e17b259.sql:26` | — | vivos: — / mortos: fn `get_ai_recommendation_logs` |
| `brain_dominance_analysis` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260511204700_6ffd9ae7-4ef1-4244-88ba-babdb95dbba0.sql:2` | — | vivos: — / mortos: `src/components/contact-detail/behavioral-tab/NeuroDominanceTab.tsx:21` (arquivo morto) |
| `connection_anomalies` | Conexões/Webhooks/MCP | `supabase/migrations/20260420131635_46932a41-732e-4a34-83dc-ec6584ce4631.sql:2` | — | vivos: — / mortos: `src/hooks/useConnectionAnomalies.ts:59` (arquivo morto), `supabase/functions/connection-anomaly-detector/index.ts:161` (connection-anomaly-detector: sem_chamador), `src/hooks/useConnectionAnomalies.ts:45` (arquivo morto) |
| `crm_consent_audit_logs` | Core CRM / outros | `supabase/migrations/20260512110025_ab2fa5f9-a65d-4656-801d-8133e7c82653.sql:2` | — | vivos: — / mortos: `src/components/crm/consent/ConsentAuditLog.tsx:22` (arquivo morto) |
| `cron_secrets` | Observabilidade/Admin | `supabase/migrations/20260712223208_00845b35-c2fa-4378-b2e8-2649a03c4c92.sql:2` | — | vivos: — / mortos: `supabase/functions/auto-rebatch-behavioral/index.ts:52` (auto-rebatch-behavioral: gated) |
| `follow_up_approvals` | Core CRM / outros | `supabase/migrations/20260509115357_40a94b7c-1a20-49cd-b0a7-53f4d35ab3af.sql:15` | — | vivos: — / mortos: fn `approve_follow_up`, fn `reject_follow_up` |
| `notification_logs` | Notificações/Alertas | `supabase/migrations/20260512104213_27c60b18-b251-47bd-8606-97b9a5d50223.sql:2` | — | vivos: — / mortos: `supabase/functions/smart-notify/index.ts:156` (smart-notify: gated), `supabase/functions/smart-notify/index.ts:59` (smart-notify: gated) |
| `notifications` | Notificações/Alertas | `supabase/migrations/20260720000023_create_phantom_tables.sql:7` | — | vivos: — / mortos: `supabase/functions/social-events-detector/index.ts:350` (social-events-detector: gated), fn `create_notification`, fn `get_notification_summary` |
| `pipeline_stages` | Pipeline/Deals | `supabase/migrations/20260512184042_fccf5358-81d7-4eae-9083-d92055f150d1.sql:13` | — | vivos: — / mortos: fn `move_to_pipeline_stage` |
| `sms_opt_outs` | SMS | `supabase/migrations/20260416200246_1d21f8b8-a860-4bc1-a79b-6bc3f319f128.sql:66` | — | vivos: — / mortos: `supabase/functions/send-sms-campaign/index.ts:74` (send-sms-campaign: gated) |

#### E. Escritas em produção, sem leitor vivo (dado coletado e nunca exibido) — 29

| Tabela | Domínio | Criada em | Leitores vivos | Escritores (vivos / mortos) |
|---|---|---|---|---|
| `access_blocked_log` | Segurança/Acesso | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql:58` | — | vivos: `supabase/functions/validate-access/index.ts:61` (validate-access: webhook), `supabase/functions/validate-access/index.ts:80` (validate-access: webhook) / mortos: — |
| `activities` | Core CRM / outros | `supabase/migrations/20260109144944_1cfd4579-a713-4b94-89fc-38494c14566f.sql:271` | — | vivos: `src/hooks/useActivityLogger.ts:26`, `src/lib/externalData.ts:118`, `src/lib/externalData.ts:236` / mortos: fn `log_activity` |
| `attribution_models_cache` | Marketing (forms/LP/magnets/campanhas/atribuição/MQL/nurturing) | `supabase/migrations/20260417011613_40e57206-6feb-4bd8-a3f0-110e3a2cb8e1.sql:204` | — | vivos: fn `compute_attribution` / mortos: — |
| `contact_cadence_audit` | Core CRM / outros | `supabase/migrations/20260511184933_6a317244-47fb-4f40-bcef-124087073da5.sql:2` | — | vivos: fn `process_contact_cadence_audit` / mortos: — |
| `contact_objection_scripts` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260512121726_0afc1e96-70d1-4cc5-8798-450a489b420c.sql:2` | — | vivos: `supabase/functions/objection-handler/index.ts:136` (objection-handler: viva) / mortos: fn `get_contact_sidebar_by_phone` |
| `contact_preferences_audit` | Core CRM / outros | `supabase/migrations/20260511184817_6fcb48d7-fb1b-460e-b8d1-be59fe1babd7.sql:2` | — | vivos: fn `process_contact_preferences_audit` / mortos: — |
| `contact_relatives_audit` | Core CRM / outros | `supabase/migrations/20260511172410_0b23f30a-e264-4a5d-85c5-2e1bbcd4f576.sql:2` | — | vivos: fn `process_contact_relatives_audit` / mortos: — |
| `contact_time_analysis_audit` | Core CRM / outros | `supabase/migrations/20260511185007_82ddf7eb-7630-4eec-a42c-a3b38828f0dc.sql:2` | — | vivos: fn `process_contact_time_analysis_audit` / mortos: — |
| `crm_automation_reprocess_queue` | Core CRM / outros | `supabase/migrations/20260509175700_0768fff6-0a9e-41b2-8042-0f5a6823c284.sql:6` | — | vivos: `src/components/crm/CRMAutomationAuditLog.tsx:72` / mortos: fn `enqueue_crm_reprocess` |
| `crm_metric_overrides` | Core CRM / outros | `supabase/migrations/20260509174220_bc03af22-cc70-44a5-9149-dbfcbc31a350.sql:37` | — | vivos: `src/components/contact-detail/MetricOverrideFlow.tsx:49` / mortos: — |
| `customer_purchases` | Roteamento de leads / Rodízio | `supabase/migrations/20260924153441_rodizio_bloco1_fundacao.sql:24` | — | vivos: fn `trg_after_purchase` / mortos: fn `registrar_pedido_erp`, fn `fn_segmento_cliente` |
| `data_retention_policies` | Observabilidade/Admin | `supabase/migrations/20260723112943_04c3b77d-d9d6-4d99-bbf5-3840c2f21707.sql:2` | — | vivos: fn `apply_retention_policies` / mortos: — |
| `device_login_notifications` | Segurança/Acesso | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql:103` | — | vivos: `supabase/functions/detect-new-device/index.ts:78` (detect-new-device: webhook) / mortos: — |
| `disc_analysis_history_audit` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260511185757_4c83c69c-de91-439f-9c13-7b92d4c14142.sql:42` | — | vivos: fn `process_disc_analysis_audit` / mortos: — |
| `disc_communication_logs` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260124184935_7462f0ba-52a4-4ded-a9a4-316446a8223f.sql:128` | — | vivos: `supabase/functions/disc-analyzer/index.ts:283` (disc-analyzer: viva) / mortos: `src/hooks/useDISCCommunicationLogs.ts:38` (arquivo morto), `src/hooks/useDISCCommunicationLogs.ts:20` (arquivo morto) |
| `document_views` | Documentos/Assinaturas | `supabase/migrations/20260416181618_cf783015-8b5c-48a9-8de2-acbf3d4a9fc0.sql:85` | — | vivos: `supabase/functions/get-signature/index.ts:84` (get-signature: viva) / mortos: — |
| `follow_up_approvals_v2` | Core CRM / outros | `supabase/migrations/20260509123119_8d1dd77f-3e2d-412e-8e20-0eff30420cbc.sql:10` | — | vivos: `src/components/dashboard/StrategicNextStepsCard.tsx:361` / mortos: — |
| `forecast_categories_history` | Forecast | `supabase/migrations/20260417001337_e3b9438d-89c9-4f77-a877-8feab6e00231.sql:82` | — | vivos: fn `log_deal_forecast_category_change` / mortos: — |
| `incoming_webhook_dlq` | Conexões/Webhooks/MCP | `supabase/migrations/20260420121651_b36d3337-3bfe-4477-b87d-9b3a39c72679.sql:6` | — | vivos: `supabase/functions/incoming-webhook/index.ts:332` (incoming-webhook: viva) / mortos: `supabase/functions/process-webhook-dlq/index.ts:73` (process-webhook-dlq: gated), `supabase/functions/process-webhook-dlq/index.ts:156` (process-webhook-dlq: gated), `supabase/functions/process-webhook-dlq/index.ts:157` (process-webhook-dlq: gated) |
| `incoming_webhook_nonces` | Conexões/Webhooks/MCP | `supabase/migrations/20261002103000_harden_incoming_webhooks.sql:37` | — | vivos: `supabase/functions/incoming-webhook/index.ts:236` (incoming-webhook: viva), `supabase/functions/incoming-webhook/index.ts:249` (incoming-webhook: viva), `supabase/functions/incoming-webhook/index.ts:277` (incoming-webhook: viva) / mortos: — |
| `interactions_audit` | Core CRM / outros | `supabase/migrations/20260511185221_db922848-ea45-492c-b3f4-f40bf8f2b6db.sql:24` | — | vivos: fn `process_interactions_audit` / mortos: — |
| `life_events_history` | Core CRM / outros | `supabase/migrations/20260510111850_c4f05e17-5aaf-4034-924b-1002fab6643d.sql:11` | — | vivos: fn `audit_life_events` / mortos: — |
| `mcp_tool_calls` | Conexões/Webhooks/MCP | `supabase/migrations/20260420125536_bb83da3a-a9cf-42d0-8a60-d1110c7a999f.sql:7` | — | vivos: `supabase/functions/mcp-server/index.ts:214` (mcp-server: viva), `supabase/functions/mcp-server/index.ts:223` (mcp-server: viva) / mortos: — |
| `reframing_analysis_audit` | Comportamental/NLP/DISC/Neuro | `supabase/migrations/20260511190139_affdb8bf-798b-4f2b-bf9c-f8c9898717e0.sql:33` | — | vivos: fn `process_reframing_audit` / mortos: — |
| `rodizio_distribuicao_staging` | Roteamento de leads / Rodízio | `supabase/migrations/20260924153441_rodizio_bloco1_fundacao.sql:94` | — | vivos: fn `rodizio_reverter_execucao`, fn `rodizio_sugerir_distribuicao`, fn `rodizio_aplicar_onda` / mortos: — |
| `rodizio_execucoes` | Roteamento de leads / Rodízio | `supabase/migrations/20260924153441_rodizio_bloco1_fundacao.sql:73` | — | vivos: fn `rodizio_closer_executar`, fn `rodizio_sdr_executar`, fn `rodizio_reverter_execucao` / mortos: — |
| `social_scraping_schedule` | Social | `supabase/migrations/20260124175308_b3969198-77f8-4de4-abb9-1ef9475dd1d7.sql:86` | — | vivos: `supabase/functions/social-profile-scraper/index.ts:169` (social-profile-scraper: viva), `supabase/functions/social-profile-scraper/index.ts:267` (social-profile-scraper: viva) / mortos: `supabase/functions/social-events-detector/index.ts:358` (social-events-detector: gated), `supabase/functions/social-events-detector/index.ts:53` (social-events-detector: gated) |
| `whatsapp_ingestion_logs` | WhatsApp | `supabase/migrations/20260509120024_229eca8e-97fb-4c6a-8a2a-bdc7070c4592.sql:24` | — | vivos: `supabase/functions/evolution-webhook/index.ts:320` (evolution-webhook: webhook), `supabase/functions/evolution-webhook/index.ts:338` (evolution-webhook: webhook), `supabase/functions/evolution-webhook/index.ts:358` (evolution-webhook: webhook) / mortos: — |
| `whatsapp_transcriptions` | Conversation Intelligence | `supabase/migrations/20260509115734_ef006f0a-d94e-43d2-9b73-a1760e17b259.sql:2` | — | vivos: `supabase/functions/whatsapp-import/index.ts:177` (whatsapp-import: viva) / mortos: — |

> Observações sobre as listas:
> - `permissions`, `role_permissions` e `user_roles` são tabelas de configuração com seed em migration. Nelas, "sem produtor" significa **sem tela de edição**, não feature quebrada.
> - `audit_log_default` é partição. Não é lacuna.
> - `login_attempts` deveria ser gravada por `service_role` (`20261006120000_…sql:87-89`), mas nenhuma edge function grava nela.

## Funções sem chamador

Base: 277 funções no estado final.

| Classe | Qtde |
|---|---:|
| Chamadas pelo app (front vivo / edge), inclusive via wrappers (`rodizioRpc.ts`, `useInteractionsRpc.ts`) | 83 |
| Funções de trigger com `CREATE TRIGGER` no repo | 52 |
| Chamadas por `pg_cron` | 15 |
| Guards `assert_*` injetados dinamicamente em corpos de função (`20260721000074…77`, blocos `guard_call`) | 18 |
| Helpers chamados por outra função SQL | 16 |
| **Sem chamador algum no repositório** | **57** |
| **Na allowlist do proxy `external-data` (`supabase/functions/external-data/index.ts:20-100`), sem chamador no front** | **24** |
| **Função de trigger sem `CREATE TRIGGER` no repo** (trigger só no canônico, `NAO_VERIFICADO`) | **5** |
| Consumidor externo declarado no comentário (Zapp Web V2 / ERP), fora deste repo | 7 |

**Total sem chamador neste repositório: 93.** Lista completa:

| # | Função | Classe | Definição final | Observação |
|---|---|---|---|---|
| 1 | `add_item_to_deal` | sem chamador | `supabase/migrations/20260720000003_bd1_deal_ownership_checks.sql:142` | depende de tabela só do canônico: `deal_items`, `products` |
| 2 | `advanced_company_search` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:489` | depende de tabela só do canônico: `customers`, `company_addresses` |
| 3 | `approve_follow_up` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:1268` | — |
| 4 | `assign_territory` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:1159` | depende de tabela só do canônico: `company_addresses`, `territories` |
| 5 | `audit_trigger_func` | função de trigger sem CREATE TRIGGER no repo | `supabase/migrations/20261005230000_fix_contacts_companies_write_triggers.sql:183` | — |
| 6 | `auto_update_relationship_stage` | função de trigger sem CREATE TRIGGER no repo | `supabase/migrations/20261005230000_fix_contacts_companies_write_triggers.sql:229` | — |
| 7 | `autocomplete_companies` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:531` | depende de tabela só do canônico: `company_addresses` |
| 8 | `bulk_add_tag` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:70` | — |
| 9 | `bulk_update_companies` | sem chamador | `supabase/migrations/20260721000066_fix_bulk_update_companies_authz.sql:19` | — |
| 10 | `bulk_update_status` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:149` | — |
| 11 | `check_at_risk_contacts` | sem chamador | `supabase/migrations/20260509170538_45b95e4b-470c-4067-af3c-7502d9b60532.sql:103` | — |
| 12 | `check_behavioral_regen_cron_staleness` | sem chamador | `supabase/migrations/20260713105030_f26185f4-df7c-4f97-b866-a909011939b3.sql:2` | — |
| 13 | `cleanup_old_data` | sem chamador | `supabase/migrations/20260721000067_fix_cleanup_old_data_table_whitelist.sql:17` | — |
| 14 | `cleanup_old_health_snapshots` | sem chamador | `supabase/migrations/20260420211439_86dd2e38-5985-4465-9f0a-bb770155a426.sql:37` | — |
| 15 | `clone_company` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:125` | — |
| 16 | `clone_workflow_setup` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:175` | — |
| 17 | `complete_reminder` | sem chamador | `supabase/migrations/20260721000076_fix_secdef_entity_ownership_guard_2.sql:17` | depende de tabela só do canônico: `reminders` |
| 18 | `create_company` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:451` | depende de tabela só do canônico: `company_addresses`, `company_phones`, `company_emails` |
| 19 | `create_economic_group` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:214` | depende de tabela só do canônico: `economic_group_members`, `economic_groups` |
| 20 | `create_notification` | sem chamador | `supabase/migrations/20260721000071_fix_secdef_crlf_unguarded.sql:20` | — |
| 21 | `create_smart_reminder` | sem chamador | `supabase/migrations/20260721000071_fix_secdef_crlf_unguarded.sql:75` | 💥 lê/grava tabela inexistente em qualquer schema conhecido: `disc_assessments`, `smart_reminders` |
| 22 | `create_template` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:376` | depende de tabela só do canônico: `message_templates` |
| 23 | `create_webhook` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:397` | depende de tabela só do canônico: `webhooks` |
| 24 | `decrypt_connection_config` | sem chamador | `supabase/migrations/20260420120250_19397a25-edf3-4939-854a-9d4fdc534f65.sql:54` | — |
| 25 | `definir_como_filial` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:324` | — |
| 26 | `definir_hierarquia_cooperativa` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:360` | — |
| 27 | `encerrar_vinculo_sdr_closer` | sem chamador | `supabase/migrations/20260924214837_t215_hotfix_vincular_encerrar_sdr_closer_is_ativo.sql:6` | depende de tabela só do canônico: `sdr_closer_assignments` |
| 28 | `encrypt_connection_config` | sem chamador | `supabase/migrations/20260420120250_19397a25-edf3-4939-854a-9d4fdc534f65.sql:40` | — |
| 29 | `enqueue_crm_reprocess` | função de trigger sem CREATE TRIGGER no repo | `supabase/migrations/20260509175700_0768fff6-0a9e-41b2-8042-0f5a6823c284.sql:30` | — |
| 30 | `enqueue_smart_notification` | sem chamador | `supabase/migrations/20260417195323_b84a83b6-e3b8-4d98-be74-9c37a1bdfc21.sql:58` | — |
| 31 | `ensure_audit_log_partition` | sem chamador | `supabase/migrations/20260711152838_4a2451e6-e015-477b-99fc-ea820078259a.sql:19` | — |
| 32 | `export_contacts_csv` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:426` | depende de tabela só do canônico: `contact_phones`, `contact_emails` |
| 33 | `find_contacts_by_role` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:310` | depende de tabela só do canônico: `contact_phones`, `contact_emails` |
| 34 | `fuzzy_search_companies` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:551` | depende de tabela só do canônico: `company_addresses` |
| 35 | `generate_daily_digest` | sem chamador | `supabase/migrations/20260721000071_fix_secdef_crlf_unguarded.sql:125` | 💥 lê/grava tabela inexistente em qualquer schema conhecido: `digest_history` |
| 36 | `generate_pre_contact_briefing` | sem chamador | `supabase/migrations/20260721000071_fix_secdef_crlf_unguarded.sql:199` | 💥 lê/grava tabela inexistente em qualquer schema conhecido: `disc_assessments`, `shared_interests`, `objections`, `pre_contact_briefings` |
| 37 | `generate_rapport_suggestions` | sem chamador | `supabase/migrations/20260721000071_fix_secdef_crlf_unguarded.sql:296` | 💥 lê/grava tabela inexistente em qualquer schema conhecido: `shared_interests`, `contact_communication_style`, `rapport_score_history` |
| 38 | `get_ai_recommendation_logs` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:1312` | — |
| 39 | `get_best_contact_times` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:910` | — |
| 40 | `get_contact_sidebar_by_phone` | consumidor externo declarado (fora do repo) | `supabase/migrations/20261002154500_get_contact_sidebar_by_phone.sql:15` | Zapp Web V2 edge crm-integration; depende de tabela só do canônico: `contact_phones`, `contact_emails`, `contact_social_media` |
| 41 | `get_contacts_by_role` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:334` | — |
| 42 | `get_incomplete_companies` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:725` | depende de tabela só do canônico: `company_phones`, `company_emails` |
| 43 | `get_notification_summary` | sem chamador | `supabase/migrations/20260721000071_fix_secdef_crlf_unguarded.sql:379` | 💥 lê/grava tabela inexistente em qualquer schema conhecido: `smart_reminders`; depende de tabela só do canônico: `inactivity_alerts` |
| 44 | `get_system_config_num` | sem chamador | `supabase/migrations/20260715190421_5c51ba03-2b4a-4802-9896-a835854471e8.sql:45` | — |
| 45 | `get_tasks_by_contact` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:1208` | — |
| 46 | `get_team_member_ids` | sem chamador | `supabase/migrations/20260416105501_572d12be-d75d-4844-98cb-1ef31eb0677b.sql:6` | — |
| 47 | `get_top_slow_rpcs` | sem chamador | `supabase/migrations/20261006140000_ai_gateway_observability.sql:505` | — |
| 48 | `log_deal_status_change` | função de trigger sem CREATE TRIGGER no repo | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql:299` | — |
| 49 | `mark_deal_lost` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20260720000003_bd1_deal_ownership_checks.sql:86` | — |
| 50 | `merge_contacts` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:572` | depende de tabela só do canônico: `contact_phones`, `contact_emails` |
| 51 | `merge_duplicate_companies` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:526` | depende de tabela só do canônico: `customers` |
| 52 | `merge_duplicate_contacts` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:620` | — |
| 53 | `move_deal` | sem chamador | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql:2` | — |
| 54 | `move_deal_to_stage` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20260720000003_bd1_deal_ownership_checks.sql:46` | — |
| 55 | `move_to_pipeline_stage` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:177` | — |
| 56 | `multiplix_count_audience` | consumidor externo declarado (fora do repo) | `supabase/migrations/20260926133544_multiplix_audience_rpcs.sql:170` | Zapp Web V2 (Multiplix) via service_role; depende de tabela só do canônico: `customers`, `company_addresses`, `users` |
| 57 | `multiplix_list_ramos` | consumidor externo declarado (fora do repo) | `supabase/migrations/20260926133544_multiplix_audience_rpcs.sql:12` | Zapp Web V2 (Multiplix) |
| 58 | `multiplix_list_ufs` | consumidor externo declarado (fora do repo) | `supabase/migrations/20260926133544_multiplix_audience_rpcs.sql:27` | Zapp Web V2 (Multiplix); depende de tabela só do canônico: `company_addresses` |
| 59 | `multiplix_resolve_recipients` | consumidor externo declarado (fora do repo) | `supabase/migrations/20260926135318_fix_multiplix_search_and_resolve_text_casts.sql:122` | Zapp Web V2 (Multiplix); depende de tabela só do canônico: `customers`, `users`, `contact_phones` |
| 60 | `multiplix_search_audience` | consumidor externo declarado (fora do repo) | `supabase/migrations/20260926135318_fix_multiplix_search_and_resolve_text_casts.sql:1` | Zapp Web V2 (Multiplix); depende de tabela só do canônico: `customers`, `company_addresses`, `users` |
| 61 | `onboard_new_company` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:271` | depende de tabela só do canônico: `customers` |
| 62 | `record_nps_response` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:449` | depende de tabela só do canônico: `nps_surveys` |
| 63 | `refresh_daily_kpis` | sem chamador | `supabase/migrations/20260721000061_fix_mv_refresh_functions.sql:14` | — |
| 64 | `refresh_daily_stats` | sem chamador | `supabase/migrations/20260721000061_fix_mv_refresh_functions.sql:25` | — |
| 65 | `registrar_pedido_erp` | consumidor externo declarado (fora do repo) | `supabase/migrations/20260924153509_rodizio_bloco1_erp_contract.sql:2` | ERP (contrato ERP→SINGU); depende de tabela só do canônico: `customers`, `integration_logs` |
| 66 | `reject_follow_up` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:1290` | — |
| 67 | `remove_company_tag` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:56` | — |
| 68 | `remove_tag` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:43` | — |
| 69 | `reset_daily_lead_counts` | sem chamador | `supabase/migrations/20260415235103_6d9257c6-3b63-4b05-a35a-384e81da7994.sql:2` | — |
| 70 | `resolve_alerts_batch` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:417` | — |
| 71 | `respond_to_proposal` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:419` | depende de tabela só do canônico: `proposals` |
| 72 | `restore_company` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:244` | depende de tabela só do canônico: `customers` |
| 73 | `search_contacts_by_nlp` | sem chamador | `supabase/migrations/20260522142957_beb532ac-a0b4-4e84-9ccc-1ddd68b9c080.sql:65` | — |
| 74 | `search_contacts_fuzzy` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:374` | — |
| 75 | `seed_deal_room` | sem chamador | `supabase/migrations/20260417003149_4ff2385c-d333-41c5-9f8f-6a640545f215.sql:131` | — |
| 76 | `seed_playbook_defaults` | sem chamador | `supabase/migrations/20260417005023_6d2d8ea7-c2c8-4caa-88d3-9a3cc518bb31.sql:136` | — |
| 77 | `singu_delete` | sem chamador | `supabase/migrations/20260721000068_fix_singu_user_impersonation.sql:24` | — |
| 78 | `singu_insert` | sem chamador | `supabase/migrations/20260721000068_fix_singu_user_impersonation.sql:57` | — |
| 79 | `singu_query` | sem chamador | `supabase/migrations/20260721000068_fix_singu_user_impersonation.sql:165` | — |
| 80 | `singu_update` | sem chamador | `supabase/migrations/20260721000068_fix_singu_user_impersonation.sql:109` | — |
| 81 | `soft_delete_company` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:216` | depende de tabela só do canônico: `customers` |
| 82 | `soft_delete_contact` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:271` | — |
| 83 | `trigger_log_interaction_activity` | função de trigger sem CREATE TRIGGER no repo | `supabase/migrations/20261005230000_fix_contacts_companies_write_triggers.sql:158` | — |
| 84 | `update_company_partial` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:86` | — |
| 85 | `update_company_status` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:120` | — |
| 86 | `update_contact` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:208` | — |
| 87 | `update_deal_amount` | sem chamador | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql:41` | — |
| 88 | `update_deal_status` | sem chamador | `supabase/migrations/20260720000003_bd1_deal_ownership_checks.sql:112` | — |
| 89 | `update_territory` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:1236` | depende de tabela só do canônico: `territories` |
| 90 | `upsert_company` | sem chamador | `supabase/migrations/20260721000077_fix_secdef_remaining_guards.sql:319` | — |
| 91 | `upsert_contact_email` | na allowlist do proxy `external-data`, sem chamador no front | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql:248` | depende de tabela só do canônico: `contact_emails` |
| 92 | `vincular_empresa_grupo` | sem chamador | `supabase/migrations/20260720000005_bd2_company_contact_ownership_checks.sql:395` | — |
| 93 | `vincular_sdr_closer` | sem chamador | `supabase/migrations/20260924214837_t215_hotfix_vincular_encerrar_sdr_closer_is_ativo.sql:30` | depende de tabela só do canônico: `sdr_closer_assignments` |

**RPCs chamadas pelo código e inexistentes no repositório:**
- Locais, que quebram em qualquer ambiente:
  - `increment` (`supabase/functions/sequence-processor/index.ts:359`);
  - `increment_workflow_completed` (`supabase/functions/nurturing-runner/index.ts:145`).
  Os erros são engolidos com `.catch(() => {})`.
- Via cliente externo:
  - `get_territories` e `get_territory_performance` (`supabase/functions/territory-optimization/index.ts:231-232`);
  - 94 das 137 RPCs da allowlist do proxy não têm `CREATE FUNCTION` no repo. Exemplos: gamificação (`get_user_goals` em `src/hooks/useGamification.ts:76`, `get_leaderboard` em `:127`, `check_and_award_badges` em `:159`), `create_task` (`src/hooks/useTasks.ts:137`), `snooze_reminder` (`:260`) e `get_instant_kpis` (`src/hooks/useInstantKpis.ts:24`). Existem, quando muito, só no canônico (`NAO_VERIFICADO`).
- `reopen_task` foi criada "da allowlist" (`20261008120000_…sql:1223`), **mas não está na allowlist**. O proxy responde 400 (`supabase/functions/external-data/index.ts:456-457`) e o front cai no fallback (`src/hooks/useTasks.ts:238-242`).

**Views sem consumidor (9 de 20):**
- `csat_surveys_public` (`20260720000001_…:50`)
- `document_signatures_public` (`:19`)
- `forms_public` e `landing_pages_public` (`20260522142957_…:36,42`)
- `push_subscriptions_safe` (`20260405111331_…:5`)
- `users_public` (`20260924181425_…:7`)
- `v_entities` (`20260712215719_…:131`)
- `v_contact_relatives_audit` (`20260511172410_…:50`)
- `vw_contacts_nlp` (`20260522142957_…:60`), usada só por `search_contacts_by_nlp`, que não tem chamador.

As views `*_public` foram substituídas por RPCs em `20261006120000_…sql:93-160`.

## Jobs pg_cron e filas sem worker

### Os 19 jobs declarados

| # | Job | Schedule | Chama | Migration:linha | Status / problema |
|---|---|---|---|---|---|
| 1 | `validation-queue-drain` | `*/5 * * * *` | `net.http_post` → `https://rqodmqosrotmtrjnnjul.supabase.co/functions/v1/validation-queue-worker` | `20260417120721_…sql:14` (url `:18`, headers `:19`) | 💥 Ref de projeto que não é o canônico. Só envia `Authorization` (JWT anon embutido), **sem `x-cron-secret`**, e o worker exige o secret (`supabase/functions/validation-queue-worker/index.ts:24`) → 401 a cada 5 min |
| 2 | `revalidate-stale-emails` | `0 4 * * *` | `INSERT INTO validation_queue … FROM email_verifications` | `20260417120721_…sql:24` | Enfileira, mas a fila só é drenada pelo job 1, que está quebrado → acumula |
| 3 | `revalidate-stale-phones` | `30 4 * * *` | idem, a partir de `phone_validations` | `20260417120721_…sql:41` | Idem |
| 4 | `check-contact-health-daily` | `0 0 * * *` | `check_contact_health_alerts()` (`20260509173700_…sql:102`) | `20260509173046_…sql:7` | `cron.schedule` sem guarda de existência do `pg_cron`; sem teste SQL |
| 5 | `smart-notify-automation` | `0 */4 * * *` | `net.http_post` → `https://hjhthvzwtvwgdrochcam.supabase.co/functions/v1/smart-notify` | `20260512105729_…sql:6` (url `:10`, headers `:11`) | 💥 Três falhas (detalhe abaixo da tabela) |
| 6 | `cleanup-simulated-alerts-weekly` | `0 3 * * 0` | `cleanup_simulated_alerts()` | `20260713124628_…sql:28` | OK |
| 7 | `mtta-sla-breach-auto-ack-hourly` | `7 * * * *` | `auto_ack_stale_mtta_sla_breaches()` | `20260715184735_…sql:31` | OK (testado em `tests/rls/mtta_sla_breach.sql`) |
| 8 | `mtta-auto-ack-heartbeat-watchdog` | `*/30 * * * *` | `check_mtta_auto_ack_heartbeat()` | `20260717142132_…sql:69` | OK, sem teste |
| 9 | `apply-data-retention-daily` | `15 3 * * *` | `apply_retention_policies()` (`20260723112943_…sql:75`) | `20260723112943_…sql:125` | 🟨 Apaga dados de verdade (detalhe abaixo da tabela) |
| 10 | `ai-gateway-alerts-eval` | `*/5 * * * *` | `evaluate_ai_gateway_alerts()` | `20260723152932_…sql:93`; consolidado em `20261006140000_…sql:905` | OK |
| 11 | `auto_resolve_ai_gateway_alerts` | `2-59/5 * * * *` | `auto_resolve_ai_gateway_alerts()` | `20260723153336_…sql:178`; `20261006140000_…sql:906` | OK |
| 12 | `ai-gateway-metrics-ensure-partition` | `15 3 * * *` | `ensure_ai_gateway_metrics_partition()` | `20260723154109_…sql:128`; `20261006140000_…sql:907` | OK |
| 13 | `ai-gateway-metrics-drop-old` | `0 4 * * 0` | `drop_old_ai_gateway_metrics_partitions(90)` | `20260723154109_…sql:134`; `20261006140000_…sql:908` | OK |
| 14 | `cleanup_rpc_perf_samples_daily` | `15 3` → `30 3 * * *` | `cleanup_rpc_perf_samples()` | `20260723154748_…sql:254`; `20261006140000_…sql:909` | OK |
| 15 | `capture-degraded-rpc-plans` | `*/15 * * * *` | `capture_degraded_rpc_plans()` | `20260726144422_…sql:3`; `20261006140000_…sql:910` | OK |
| 16 | `singu-rodizio-segmentar` | `0 1 * * *` | `rodizio_segmentar_carteira()` (`20260924181919_…sql:605`) | `20260924213115_…sql:39` | 🔌 Segmenta por `customer_purchases`, que **não tem produtor** (ver G05). Sem guarda de `pg_cron` e sem teste |
| 17 | `singu-rodizio-closer` | `0 6 * * 1` | `cron_rodizio_closer_tick()` → `rodizio_closer_executar('REAL',250)` se `RODIZIO_CLOSER_ATIVO` | `20260924213115_…sql:40` | Kill switch em `config_regras_negocio`, tabela só do canônico; sem teste |
| 18 | `singu-rodizio-sdr` | `10 6 * * 1` | `cron_rodizio_sdr_tick()` | `20260924213115_…sql:41` | Idem |
| 19 | `singu-rodizio-bloqueios` | `10 7 * * *` | `rodizio_expirar_bloqueios()` | `20260924213115_…sql:42` | Sem teste |

**Detalhe dos jobs problemáticos:**

- **Job 5 (`smart-notify-automation`), três falhas.**
  1. O ref `hjhthvzwtvwgdrochcam` é o antigo (`supabase/config.toml:1`).
  2. O cabeçalho é montado com `'…Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb`. Como `::` tem precedência sobre `||`, o Postgres converte `'"}'` em jsonb primeiro, e isso é JSON inválido → erro em toda execução.
  3. Não envia `x-cron-secret`, que a edge exige (`supabase/functions/smart-notify/index.ts:10`).
- **Job 9 (`apply-data-retention-daily`).** Apaga dados de verdade:
  - `interactions` com mais de 3 anos e `whatsapp_messages` com mais de 2 anos (`20260723112943_…sql:40-42`, `DELETE` dinâmico em `:94-95`);
  - não há UI: `data_retention_policies` não tem leitor no front;
  - não há teste SQL.

**Respostas às perguntas do item 4:**
- **Job chamando função/edge inexistente?**
  - Todas as funções SQL chamadas por cron existem no estado final.
  - Os 2 jobs HTTP apontam para edge functions que existem no repo, mas em **projetos errados** e sem o header exigido.
- **Desagendados?** Nenhum job foi desagendado em definitivo. Todo `cron.unschedule` (`20260417120721:10`, `20260713124628:26`, `20260715184735:29`, `20260717142132:67`, `20260723112943:123`, `20260723152932:88`, `20260723153336:177`, `20260723154109:125`, `20260723154748:252`, `20260726144422:1`, `20261006140000:913`) é seguido de reagendamento.
- **Os jobs existem em produção?** `NAO_VERIFICADO`, com indícios contra:
  - o dump da origem feito para a migração registra **"pg_cron não disponível na origem"** (`scripts/migration/ddl/12_cron_jobs.sql:3`), embora `00_extensions.sql:7` liste a extensão. Ou seja, nenhum job foi exportado para o banco novo;
  - `20261006140000_…sql:1-2` afirma que as migrations `20260723152549..20260726154947` "nunca [foram] aplicadas aqui" (no canônico);
  - `20260924213115_…sql:39-42` e `20260509173046_…sql:7` chamam `cron.schedule` sem verificar se a extensão existe.
- **Jobs que o próprio banco espera e que não existem.**
  - `get_behavioral_regen_cron_health` (`20260713104851_…sql:29-30`) e `check_behavioral_regen_cron_staleness` (`20260713105030_…sql:2`) monitoram `process-behavioral-regen-queue-5min` e `cleanup-behavioral-regen-queue-daily`. **Nenhuma migration os agenda.**
  - `refresh_daily_kpis` e `refresh_daily_stats` (`20260721000061_…sql:14,25`) não têm cron nem chamador. As MVs que o front lê (`src/hooks/useDailyKpis.ts:40,59`) nunca são atualizadas pelo repo.
  - `ensure_audit_log_partition` só roda na própria migration. As partições de `audit_log` vão até 2026-12 (`scripts/migration/ddl/11_partitions.sql`). A partir de 2027-01, tudo cai em `audit_log_default`.

### Edge functions de "cron" sem agendador

23 edge functions exigem `x-cron-secret`:
- **2** têm job, e os dois estão quebrados (jobs 1 e 5).
- **21 não têm nenhum agendador:** `auto-rebatch-behavioral`, `auto-regen-behavioral-profiles`, `check-health-alerts`, `check-notifications`, `client-notifications`, `cs-health-recalc`, `forecast-snapshot-cron`, `generate-behavioral-profile`, `lead-score-cron`, `mql-evaluator`, `nurturing-runner`, `process-behavioral-regen-queue`, `process-webhook-dlq`, `retry-behavioral-profile`, `revops-snapshot-builder`, `send-sms-campaign`, `sequence-processor`, `social-events-detector`, `sync-social-interests`, `template-success-notifications` e `weekly-digest`. A linha do gate está em `supabase/functions/<nome>/index.ts`, por exemplo `cs-health-recalc:7`, `lead-score-cron:10`, `sequence-processor:54` e `weekly-digest:31`.
- 13 dessas são chamadas pelo front vivo, que **não envia** o header: nenhuma ocorrência de `x-cron-secret` em `src/` → 401. Exemplos: `src/hooks/useRevOps.ts:193`, `src/hooks/useSmsCampaigns.ts:106`, `src/hooks/useSequenceProcessor.ts:9`, `src/hooks/useWeeklyReport.ts:169`.

### Tabelas de fila/agendamento × worker

| Tabela de fila | Produtor vivo | Worker | Status |
|---|---|---|---|
| `validation_queue` | trigger `enqueue_contact_validation`, crons 2 e 3, `bulk-revalidate` | `validation-queue-worker` (cron 1 quebrado) | 💥 |
| `behavioral_profile_regen_queue` | front admin (`src/pages/admin/InsightFeedbackAnalytics.tsx:192`), `enqueue_behavioral_profile_regen` | `process-behavioral-regen-queue` (gated, sem cron) | ⏰ |
| `lead_score_recompute_queue` | trigger `trigger_lead_score_recompute`, `lead-scorer` | `lead-score-cron` (gated, sem cron, `supabase/functions/lead-score-cron/index.ts:10`) | ⏰ |
| `incoming_webhook_dlq` | `incoming-webhook/index.ts:332` | `process-webhook-dlq` (gated; só o hook morto `src/hooks/useWebhookDlq.ts:44` chama) | ⏰ |
| `social_sync_queue` | front (`src/hooks/commercial/useSocialSync.ts:52`) | `sync-social-interests` (gated) | ⏰ |
| `social_scraping_schedule` | `social-profile-scraper` | `social-events-detector` (gated) | ⏰ |
| `nurturing_executions` | `enroll_contact_in_workflow` | `nurturing-runner` (gated) | ⏰ |
| `sequence_enrollments` | front, `lead-score-threshold-runner` | `sequence-processor` (gated) | ⏰ |
| `sms_campaign_recipients` | só `send-sms-campaign` (gated) | idem | ⏰ |
| `campaign_recipients` | front (`src/hooks/useEmailCampaigns.ts:131`) | **nenhum** (envio simulado) | ❌ |
| `crm_automation_reprocess_queue` | front (`src/components/crm/CRMAutomationAuditLog.tsx:72`); a função de trigger `enqueue_crm_reprocess` (`20260509175700_…sql:30`) **não tem trigger** | **nenhum** | ❌ |
| `nurturing_enrollments` | nenhum | nenhum | ⬛ |
| `smart_notifications` | 4 triggers `notify_*` | front (in-app) | OK; `enqueue_smart_notification` sem chamador |
| `rodizio_distribuicao_staging` | `rodizio_sugerir_distribuicao` (front) | `rodizio_aplicar_onda` (front) | OK (manual) |
| `sequence_send_log` | `sequence-track` (webhook) | — (log) | OK |

**Resultado: 11 de 15 filas sem worker funcional.**

## Tabelas ausentes (scripts/tabelas-ausentes) — status hoje

- **O que é:** `scripts/tabelas-ausentes.md` lista **119** tabelas/views que `src/` acessa com `.from()` e que **não constam do `src/integrations/supabase/types.ts`**, o schema do canônico gerado em 2026-08-04.
  - O texto diz que compara com "PostgREST OpenAPI de `pgxfvjmuubtbowutlide`" (`scripts/tabelas-ausentes.md:5`), mas o script compara com o `types.ts` (`scripts/audit-ausentes.mjs:5-9`).
  - O artefato é de `c9b22b5` (2026-08-04) e nunca foi regerado.
- **Status no HEAD:**
  - **117 de 119** têm `CREATE TABLE`/`VIEW` nas migrations **e** aparecem no dump DDL de origem (`scripts/migration/ddl/02_tables.sql`).
  - **1 existe só no dump, sem migration:** `ai_recommendation_audit_logs_v2` (`scripts/migration/ddl/02_tables.sql:200-201`). O front a usa em `src/hooks/useRecommendationAudit.ts:25` e `src/pages/RecommendationAudit.tsx:30`. Além disso, está na lista `service_only` que revoga o acesso de `authenticated` (`20260723150429_…sql:33`).
  - **1 existe só nas migrations, sem estar no dump de origem:** `social_insights`, criada em `20260720000023_create_phantom_tables.sql:95` ("tabelas fantasmas referenciadas por edge functions"). É lida por `src/hooks/useSocialInsights.ts:48` e **não tem produtor**.
  - **119 de 119 continuam fora do `types.ts`**, que tem um único commit.
- **Em produção:** `NAO_VERIFICADO`. Há indício de que boa parte já existe no canônico: `20261006120000_…sql:4` mediu "grants em 246 tabelas de public" e opera sobre `forms`, `lead_magnets`, `landing_pages`, `csat_surveys` e `document_signatures`, todas da lista. O próprio repo admite lacunas pontuais no canônico:
  - buckets `documents` e `whatsapp-audio` (`20261006120100_…sql:1-3`);
  - colunas de relatório (`20261011125900_…sql:1`);
  - `increment_landing_page_view` (`20261006120000_…sql:12`).
- **Conclusão:** como lista de "falta criar no banco", `tabelas-ausentes.*` está **obsoleta**. Como sintoma, segue válida: o contrato de tipos do front não descreve o banco real (ver G08).

## Stubs/TODO no SQL

| Item | Evidência | Natureza |
|---|---|---|
| Migration-placeholder "TODO HIBP": proteção de senha vazada exige ação manual no dashboard/API; o corpo é `SELECT 1; -- no-op placeholder` | `20260721000044_todo_enable_hibp_password_check.sql:1-18` | TODO operacional, `NAO_VERIFICADO` |
| Trigger ativo com corpo vazio: `handle_recurring_life_event()` só faz `RETURN NEW` ("This trigger can be expanded…") e está ligado a `life_events` por `tr_handle_recurring_life_event` | `20260509184703_…sql:10-23` | Stub (eventos recorrentes não avançam) |
| Migration "vazia" que adia a feature para o front ("Por enquanto, focaremos na implementação do Front-end") | `20260509181659_…sql:1-7` | Planejamento não executado no banco |
| Retorno por regras fixas: `get_contact_life_event_gaps` devolve 2 linhas literais condicionais | `20260509184703_…sql:26-44` | Heurística fixa (não é stub puro) |
| Wrapper "mockando o trigger" | `20260509174414_…sql:7` | Comentário legado; função real em `:18` |
| 5 funções que leem/gravam tabelas que **não existem em nenhum schema conhecido** (nem migrations, nem `types.ts`, nem `.bak`, nem dump): `create_smart_reminder` (`disc_assessments`, `smart_reminders`), `generate_daily_digest` (`digest_history`), `generate_pre_contact_briefing` (`disc_assessments`, `shared_interests`, `objections`, `pre_contact_briefings`), `generate_rapport_suggestions` (`shared_interests`, `contact_communication_style`, `rapport_score_history`), `get_notification_summary` (`smart_reminders`) | `20260721000071_fix_secdef_crlf_unguarded.sql:75,125,199,296,379` (uso em `:106-110,180,240-278,323-360,401-408`) | 💥 Código morto que falharia em runtime (plpgsql só valida tabela na execução) |
| Funções que referenciam MVs inexistentes no repo: `refresh_daily_kpis`/`refresh_daily_stats` | `20260721000061_…sql:14,25` | Dependência fora do repo |
| Alinhamento dinâmico de schema: colunas criadas por `EXECUTE format` só se faltarem ("já existentes no canônico") | `20261011125900_align_report_schema.sql:1-34` | Admite divergência repo × canônico |
| Funções com corpo vazio além de `handle_recurring_life_event` | — | Nenhuma encontrada (critério: corpo só `BEGIN RETURN …; END`) |

Não foram encontradas ocorrências de `FIXME`, `not implemented`, `fase 2` ou `stub` em código SQL ativo. Os demais hits de `future`/`legacy` são comentários descritivos.

## Lacunas declaradas pelas migrations canônicas recentes

| Migration | O que ela declara | O que continua faltando (verificado no repo) |
|---|---|---|
| `20261006120000_least_privilege_canonical.sql:3-12` | "anon tinha grants em 246 tabelas"; policies por token expunham CSAT e assinaturas de todos; a página pública de lead magnet falhava; `increment_landing_page_view` não existia | Corrigido no schema, mas 9 views `*_public`/legadas ficaram sem consumidor (seção Views) |
| `20261006120100_storage_buckets_singu.sql:1-3` | Buckets `documents` e `whatsapp-audio` "ausentes no projeto canônico" | — |
| `20261006130000_frontend_rpcs_authenticated.sql:1-17` | RPCs do front davam 42501 no canônico. `enroll_contact_in_workflow` usava a coluna inexistente `enrolled_count`; `get_marketing_funnel_stats` lia a tabela inexistente `marketing_forms`; `compute_revops_kpis` e `evaluate_mql` usavam colunas inexistentes; `move_deal_atomic(uuid,text,numeric)` lia `is_allowed`, coluna inexistente | `log_deal_status_change` foi corrigida, mas **não há `CREATE TRIGGER` para ela no repo** (só no canônico) |
| `20261006140000_ai_gateway_observability.sql:1-4` | As migrations `20260723152549..20260726154947` "nunca [foram] aplicadas aqui"; consolida o estado | **O ledger do repo não reflete o canônico.** Não dá para saber, só pelo repo, quais das demais 446 migrations estão aplicadas |
| `20261007100000_external_rpc_user_scope.sql:1-6` | RPCs do proxy passam a rodar com o JWT do usuário | — |
| `20261008120000_fix_frontend_rpcs_canonical.sql:1-22,1195` | Mapeia colunas reais do canônico (`telefone→phone`, `reminders` sem `contact_id`…) e "cria as 7 RPCs da allowlist que não existiam" | (a) 24 das RPCs corrigidas/criadas **não têm chamador no front** (`approve_follow_up`, `reject_follow_up`, `get_ai_recommendation_logs`, `get_tasks_by_contact`, `update_territory`, `assign_territory`, `create_company`, `update_contact`…). (b) `reopen_task` foi criada, mas **não foi incluída na allowlist** → 400. (c) 94 RPCs da allowlist seguem sem DDL no repo |
| `20261011125900_align_report_schema.sql:1` | "Completar no schema limpo as colunas … já existentes no canônico" | Confirma que o schema do repo não reproduz o canônico |
| `20261011130000_report_payload_contracts.sql:1` | Mantém campos legados e acrescenta séries do frontend | Coberto por `tests/rls/report_payload_contracts.sql` |
| `20261011141000_pipeline_summary_addresses.sql:74-75` | O rollback "reintroduz o erro histórico `companies.state` no canônico" | — |
| `20261002154500_get_contact_sidebar_by_phone.sql:9-11` | Consumidor é a edge `crm-integration` do **Zapp Web V2**, com service key | Consumidor fora deste repo (`NAO_VERIFICADO`); tem teste (`supabase/tests/get_contact_sidebar_by_phone.sql`) |
| `20260926133544_multiplix_audience_rpcs.sql` (cabeçalho) | RPCs só para a edge do ZAPP (service_role) | Consumidor fora deste repo; **0 testes** |
| `20260924153441_rodizio_bloco1_fundacao.sql:1-3` | "Não roda nada automaticamente (kill switch …=false)" | Os crons foram agendados depois (`20260924213115`). A fonte de compras (ERP) não existe no repo (G05) |

## Cobertura de testes SQL

- **Arquivos:** 20 em `tests/rls/*.sql` e 1 em `supabase/tests/get_contact_sidebar_by_phone.sql`.
- **Cobertura por menção** (o nome aparece no teste, o que não implica testar comportamento): **56 de 271 tabelas (20,7%)** e **73 de 277 funções (26,4%)**.
- **Execução condicional:** `tests/rls/run.sh:11-13` sai com `exit 0` se `PGHOST` não estiver definido. O CI depende de secrets (`.github/workflows/ci.yml:39,62,118,126`).
- **Domínios com 0 tabela citada em teste:** ABM, RevOps, Intent, SMS, Sequências, Win/Loss/Playbooks/Battle cards, Roteamento/Rodízio, Enriquecimento/validação, Conexões/Webhooks/MCP, Notificações/Alertas, Suporte/KB, RFM e Neuromarketing.
- **Funções críticas sem teste:**
  - **todo o motor do rodízio**: `rodizio_segmentar_carteira`, `cron_rodizio_closer_tick`, `cron_rodizio_sdr_tick`, `rodizio_closer_executar`, `rodizio_sdr_executar`, `rodizio_aplicar_onda`, `rodizio_reverter_execucao`, `rodizio_expirar_bloqueios` e `registrar_pedido_erp`. Esse motor reatribui `customers.vendedor_id` e roda por cron;
  - `apply_retention_policies`, que é destrutiva e roda diariamente;
  - `check_contact_health_alerts`, `check_mtta_auto_ack_heartbeat` e `cleanup_simulated_alerts`;
  - `merge_contacts` e as 5 RPCs `multiplix_*`.
- **Teste contraditório com a migration:** `tests/rls/authenticated_least_privilege.sql:4-6,31` afirma que `audit_log`, `error_logs`, `system_config` etc. "não entram na lista service-role-only". Já `20260723150429_…sql:22-100` faz `REVOKE ALL … FROM authenticated` em **66** tabelas, inclusive essas. O teste só verifica `cron_secrets`, então passa com qualquer um dos dois estados (ver G06).
- **Bem cobertos:** Deal Rooms (6/6 tabelas), endpoints públicos (forms/LP/magnets/CSAT), observabilidade do AI Gateway, contratos de relatório e least privilege de funções.

## Sistema de origem × schema atual

Fonte: `.lovable/memory/migration/singu_source_*.md`. É o projeto "SINGU" original, com 114 tabelas, 1.494 colunas, 13 funções, 61 triggers, 325 policies, 1 enum e 2 índices.

| Objeto da origem | Presentes no schema atual (migrations) | Faltando |
|---|---|---|
| Tabelas (114) | **114/114**, e todas também no `types.ts` em uso | 0 |
| Colunas (1.494) | 1.490 em `CREATE TABLE`/`ADD COLUMN`; as 4 restantes são de `push_subscriptions_safe`, que é **view** e existe (`20260405111331_…:5`) | 0 |
| Funções (13) | **13/13** (`audit_trigger_fn`, `has_role`, `handle_new_user`, `search_*_unaccent`, `search_products_semantic`, `reset_daily_lead_counts`…) | 0. Ressalva: `reset_daily_lead_counts`, `get_team_member_ids` e `execute_readonly_query` existem, mas sem chamador ou função |
| Triggers (61) | 48 com o mesmo nome; 9 dropados em `20260315221042_…sql:1-19` e substituídos por `set_updated_at_<tabela>` equivalentes; 4 com nome diferente, mas com trigger `updated_at` equivalente no estado final (`communication_preferences`, `disc_conversion_metrics`, `life_events`, `lux_intelligence`) | 0 funcional |
| Policies (325) | **325/325** por nome@tabela no estado final | 0 |
| Enum `app_role` | `20260323155106_…sql:3` | 0 |

**Conclusão:** a migração do **schema** de origem está completa. O que não foi migrado são **dados e jobs**:
- `pg_cron` não foi exportado (`scripts/migration/ddl/12_cron_jobs.sql:3`).
- O dump de origem de 2026-07-21 tem 258 tabelas e 117 funções. **Faltam no dump** 13 tabelas das migrations, criadas depois ou nunca aplicadas na origem: `ai_gateway_metrics`, `customer_purchases`, `customer_rotation_state`, `data_retention_policies`, `incoming_webhook_nonces`, `notifications`, `rodizio_distribuicao_staging`, `rodizio_execucoes`, `rpc_perf_samples`, `rpc_plan_snapshots`, `social_insights`, `tasks` e `audit_log_default` (esta aparece no dump como partição, em `11_partitions.sql`).
- **O dump tem `ai_recommendation_audit_logs_v2`, que nenhuma migration cria.**
- Em origem, as tabelas analíticas comportamentais tinham 16–80 kB, compatível com tabelas vazias. Isso reforça que vários painéis de "inteligência" nunca tiveram produtor, nem antes da migração.

## Lacunas detalhadas

| ID | Feature/objeto | Status | Evidência (arquivo:linha) | O que falta | Impacto no negócio (1 linha) | Esforço (P/M/G) |
|---|---|---|---|---|---|---|
| G01 | Drenagem da fila de validação de e-mail/telefone (cron `validation-queue-drain`) | 💥 QUEBRADO | `supabase/migrations/20260417120721_…sql:14-21` (url `:18` com ref `rqodmqosrotmtrjnnjul`; headers `:19` sem `x-cron-secret`); `supabase/functions/validation-queue-worker/index.ts:24`; `supabase/functions/_shared/auth.ts:237-247` | Reagendar com a URL do canônico e o header `x-cron-secret` (secret via Vault); remover o JWT embutido | E-mails e telefones nunca são revalidados; a fila cresce 2×/dia com os crons 2 e 3 | P |
| G02 | Notificações inteligentes periódicas (cron `smart-notify-automation`) | 💥 QUEBRADO | `20260512105729_…sql:6-14` (ref antigo `:10`; cast `'"}'::jsonb` inválido e `app.settings.service_role_key` em `:11`); `supabase/config.toml:1`; `supabase/functions/smart-notify/index.ts:10` | Corrigir a montagem do jsonb, a URL e o header | Lembretes automáticos a cada 4h nunca disparam | P |
| G03 | Automação agendada (21 edge functions com gate de cron sem nenhum agendador) | ⏰ SEM AGENDAMENTO | Gates em `supabase/functions/{cs-health-recalc:7, forecast-snapshot-cron:8, lead-score-cron:10, mql-evaluator:10, nurturing-runner:22, revops-snapshot-builder:20, send-sms-campaign:27, sequence-processor:54, weekly-digest:31, process-webhook-dlq:27, sync-social-interests:9, social-events-detector:35, …}/index.ts`; lista de crons (seção Jobs) | Criar 21 jobs `pg_cron`+`pg_net` com `x-cron-secret`; ou dar ao front um caminho autenticado alternativo | CS health, forecast, RevOps, lead score em lote, MQL, nurturing, sequências, SMS, weekly digest, DLQ e social sync não rodam; 13 botões do front recebem 401 | M |
| G04 | Monitor de saúde do regen comportamental | ⏰ SEM AGENDAMENTO | `20260713104851_…sql:29-30` (espera `process-behavioral-regen-queue-5min` e `cleanup-behavioral-regen-queue-daily`); `20260713105030_…sql:2` (`check_behavioral_regen_cron_staleness` sem chamador) | Agendar os 2 jobs e o watchdog | O painel admin acusa "cron ausente" o tempo todo; a fila de regen não anda | P |
| G05 | Rodízio de carteira: fonte de compras (contrato ERP→SINGU) | 🔌 DESCONECTADO | `20260924153509_rodizio_bloco1_erp_contract.sql:1-77` (`registrar_pedido_erp`, só service_role, **sem chamador no repo**); `20260924181919_…sql:44-48` (`fn_segmento_cliente` usa `max(data_pedido)` de `customer_purchases`, senão `NAO_ATIVADO`); crons em `20260924213115_…sql:39-42`; kill switch em `20260924153441_…sql:2` | Integração ERP (edge/n8n) chamando `registrar_pedido_erp` e backfill histórico de pedidos; testes do motor | Se o rodízio for ligado, todo cliente aparece como "não ativado" e a carteira ativa pode ser redistribuída indevidamente | G |
| G06 | Acesso do front a 32 tabelas revogado por migration | 💥 QUEBRADO (em banco montado pelo repo; prod `NAO_VERIFICADO`) | `20260723150429_…sql:22-100` (`REVOKE ALL … FROM authenticated` em 66 tabelas), sem re-GRANT posterior; leituras vivas em, p.ex., `src/pages/AdminAuditTrail.tsx:70` (`audit_log`), `src/hooks/useErrorLogs.ts:14`, `src/hooks/useIncomingWebhooks.ts:60`, `src/hooks/useAttribution.ts:43`, `src/hooks/useSequenceEvents.ts:33`, `src/components/admin/MttaSlaBreachHistoryCard.tsx:32`; teste contraditório em `tests/rls/authenticated_least_privilege.sql:4-6,31` | Reduzir a lista `service_only` ao que o front não lê, ou mover essas leituras para RPC | Telas admin, auditoria, webhooks, lead score, sequências e atribuição dão 42501 em ambiente novo | P |
| G07 | Schema canônico não versionado (linhagem estrangeira) | 🟨 PARCIAL | 146 tabelas e 109 views do `types.ts` sem DDL; funções dependem de `customers` (26), `config_regras_negocio` (11) e `users` (11); `20261006140000_…sql:1-2`; `20261011125900_…sql:1`; `20261006120100_…sql:1-3` | Baseline (`pg_dump --schema-only`) do canônico versionado como migration zero; reconciliar o ledger | Ambiente novo, preview e CI não nascem do repo; nenhuma correção é testável fora de produção | G |
| G08 | Contrato de tipos do front (`types.ts`) | 🟨 PARCIAL | `src/integrations/supabase/types.ts:16608-16610` (0 RPCs); 1 commit (`c9b22b5`); `scripts/tabelas-ausentes.md:3` (119 ausentes, ainda ausentes) | Regerar os tipos do canônico (`scripts/gen-supabase-types.mjs`) e regerar `tabelas-ausentes.*` | 119 tabelas e todas as RPCs sem checagem de tipo; erros de coluna só aparecem em runtime | P |
| G09 | Envio real de campanhas de e-mail | ❌ NÃO INICIADO | `src/hooks/useEmailCampaigns.ts:84-85` ("Simula o envio (não dispara emails reais…)"); nenhuma edge lê `email_campaigns`/`campaign_recipients` | Edge de envio (provedor), webhook de bounce/open/click, worker de fila | Campanhas aparecem como "sent" sem que nenhum e-mail saia | G |
| G10 | Campanhas de SMS e opt-out | ⏰ SEM AGENDAMENTO / ❌ (opt-out) | `supabase/functions/send-sms-campaign/index.ts:27` (gate); `src/hooks/useSmsCampaigns.ts:106` (front → 401); `sms_opt_outs` sem escritor (só leitura em `send-sms-campaign/index.ts:74`) | Agendar/autenticar o envio; endpoint/tela de opt-out | SMS não é enviado; sem opt-out há risco LGPD quando o envio for ligado | M |
| G11 | Briefing pré-contato, digest diário, sugestões de rapport e lembretes inteligentes no banco | 💥 QUEBRADO / ⬛ MORTO | `20260721000071_fix_secdef_crlf_unguarded.sql:75,125,199,296,379` (usam `disc_assessments`, `smart_reminders`, `digest_history`, `shared_interests`, `objections`, `pre_contact_briefings`, `contact_communication_style`, `rapport_score_history`, que não existem em nenhum schema) | Decidir: remover as 5 funções ou criar as tabelas e conectar ao app | Nenhum; são funções mortas que falhariam se chamadas | P |
| G12 | Contadores de sequência e de workflow de nurturing | 💥 QUEBRADO | `supabase/functions/sequence-processor/index.ts:359` (`rpc('increment')`); `supabase/functions/nurturing-runner/index.ts:145` (`rpc('increment_workflow_completed')`); nenhuma das duas existe | Criar as RPCs ou fazer update direto | Métricas de envio/conclusão nunca sobem (erro engolido) | P |
| G13 | Webhook de entrada com destino "note"/"custom" | 💥 QUEBRADO | `20260420115057_…sql:66` (CHECK aceita `note`, `custom`); `supabase/functions/incoming-webhook/index.ts:311-318` (`note→notes`, tabela inexistente; `custom` sem mapa) | Mapear para uma tabela real ou remover do CHECK | Webhooks configurados com esses alvos falham | P |
| G14 | RPCs da allowlist do proxy sem consumidor | 🔌 DESCONECTADO | `supabase/functions/external-data/index.ts:20-100`; 24 RPCs sem chamador (ver "Funções…"); 7 criadas em `20261008120000_…sql:1195-1318`; `reopen_task` fora da allowlist (`external-data/index.ts:456-457`, `src/hooks/useTasks.ts:238`) | Ligar as telas (aprovação de follow-up, território, logs de recomendação) ou podar a allowlist; incluir `reopen_task` | Esforço de correção em RPCs que ninguém chama; "desfazer conclusão de tarefa" depende do fallback | P |
| G15 | Roteamento de leads legado | ⬛ MORTO | `20260415233816_…sql:61,107,159,211` (`lead_routing_rules`, `lead_assignments`, `handoff_requests`, `redistribution_log`, sem leitor/escritor); `src/types/rodizio.ts:5-6`; `reset_daily_lead_counts` (`20260415235103_…sql:2`) e `get_team_member_ids` (`20260416105501_…sql:6`) sem chamador | Drop planejado (com backup) | Nenhum direto; ruído de schema, RLS e lint | P |
| G16 | Analytics de neuromarketing (gatilhos) | 🔌 DESCONECTADO | `20260125155610_…sql:7,40,53,70` (4 tabelas `trigger_*`); leitura em `src/hooks/useTriggerAnalytics.ts:13-25`; zero escritores | Instrumentar o registro de uso, A/B e efetividade por canal | Painel de A/B e de efetividade sempre vazio | M |
| G17 | Painéis comportamentais (EQ, objeções ocultas, neuro, DISC conversão, valores, critérios, horários) | 🔌 DESCONECTADO | Leitores em `src/components/contact-detail/ContactBehavioralTab.tsx:78`, `src/components/contact-detail/ContactIntelligenceTab.tsx:64`, `src/components/contact-detail/NeuroEvolutionChart.tsx:21`, `src/hooks/useDISCConversionMetrics.ts:18`, `src/components/crm/commercial/ClientValuesElite.tsx:32`, `src/components/crm/commercial/DecisionCriteriaElite.tsx:41`, `src/hooks/useContactTimeAnalysis.ts:27`; `cognitive_bias_history`/`communication_preferences` escritas só por hooks mortos (`src/hooks/useCognitiveBiasPersistence.ts:93`, `src/hooks/useCommunicationPreferences.ts:34`) | Produtores (edge de análise ou captura no front) para as 9 tabelas | A Ficha 360 mostra abas analíticas vazias para todo contato | G |
| G18 | KPIs e índice de WhatsApp | 🔌 DESCONECTADO | `whatsapp_kpis` (`20260305204447_…sql:48`) lida em `src/hooks/useWhatsAppData.ts:14`; `whatsapp_messages_index` (`20260511204700_…sql:50`) lida em `src/components/whatsapp/WhatsAppDashboard.tsx:23`; sem produtor | Job de agregação a partir de `whatsapp_messages` | Dashboard de WhatsApp sem números | M |
| G19 | Configuração de segmentos RFM | 🔌 DESCONECTADO | `rfm_segment_config`/`rfm_metrics` (`20260124180842_…sql:70,100`) lidas em `src/hooks/useRFMSegmentConfig.ts:13-14`; sem seed nem escrita | Seed padrão e tela de edição | Segmentação RFM sem parâmetros configuráveis | P |
| G20 | Insights e ROI de marketing; nurturing legado | 🔌 DESCONECTADO / ⬛ | `marketing_campaign_stats` (`20260512175533_…sql:2`) lida em `src/hooks/useMarketingInsights.ts:109` sem produtor; `marketing_roi_data` (`:30`) e `nurturing_enrollments` (`20260416110653_…sql:17`) mortas | Agregador de estatísticas; drop das legadas | Insights de marketing vazios | M |
| G21 | Conversation Intelligence de chamadas | 🔌 DESCONECTADO | `call_logs` (`20260509170538_…sql:2`) lida em `src/hooks/useUnifiedHistory.ts:125` e `src/hooks/useEvidenceForLabel.ts:54`; nenhum escritor; `interaction_summaries` (`20260512132827_…sql:30`) morta | Integração de telefonia/gravação ou remoção | Timeline e evidências não incluem ligações | G |
| G22 | Snapshots de Forecast e RevOps | ⏰ SEM AGENDAMENTO | `forecast_snapshots` só via `forecast-snapshot-cron/index.ts:51` (gate `:8`); `revops_snapshots` só via `revops-snapshot-builder/index.ts:162` (gate `:20`); leitores `src/hooks/useForecasting.ts:195`, `src/hooks/useRevOps.ts:74` | Jobs diários com secret | Sem histórico de forecast e de KPIs de receita; tendências vazias | P |
| G23 | Filas sem worker funcional | ⏰ / ❌ | Ver a tabela "Tabelas de fila × worker" (11 de 15); `enqueue_crm_reprocess` sem trigger (`20260509175700_…sql:30`) e sem worker | Agendar workers; criar worker de reprocessamento CRM | Recompute de score, DLQ, social sync, regen, nurturing, sequências e reprocessamento CRM parados | M |
| G24 | KPIs diários (MVs) | ⏰ SEM AGENDAMENTO | `20260721000055_…sql:25-26` (MVs criadas fora do repo); `refresh_daily_kpis`/`refresh_daily_stats` (`20260721000061_…sql:14,25`) sem cron/chamador; leitura em `src/hooks/useDailyKpis.ts:40,59` | Versionar o DDL das MVs e agendar o refresh | KPIs do dashboard congelados na data da última atualização manual | P |
| G25 | Partições de `audit_log` | 🟨 PARCIAL | `scripts/migration/ddl/11_partitions.sql` (até `audit_log_2026_12`); `ensure_audit_log_partition` (`20260711152838_…sql:19`) sem cron | Cron mensal de partição | A partir de 2027-01 tudo cai em `audit_log_default` (perde a poda por partição) | P |
| G26 | 57 funções SQL sem nenhum chamador | ⬛ MORTO | Lista na seção "Funções sem chamador" (p.ex. `singu_query/insert/update/delete` em `20260721000068_…sql:24-165`, `bulk_update_companies` em `20260721000066_…sql:19`, `clone_company` em `20260721000077_…sql:125`, `definir_hierarquia_cooperativa` em `20260720000005_…sql:360`) | Triagem: ligar ao app ou dropar | Superfície de ataque (SECURITY DEFINER) e custo de manutenção (várias "Waves" de hardening em código morto) | M |
| G27 | Funções de trigger sem `CREATE TRIGGER` no repo | 🟨 PARCIAL | `audit_trigger_func` (`20261005230000_…sql:183`), `trigger_log_interaction_activity` (`:158`), `auto_update_relationship_stage` (`:229`), `log_deal_status_change` (`20261006130000_…sql:299`), `enqueue_crm_reprocess` (`20260509175700_…sql:30`); nem o dump de origem as tem (`scripts/migration/ddl/09_triggers.sql`) | Versionar os triggers do canônico (ou criá-los) | Auditoria, feed de atividade e estágio automático dependem de triggers que um ambiente novo não terá | P |
| G28 | Eventos de vida recorrentes | 🟨 PARCIAL | `20260509184703_…sql:10-23` (trigger ativo com corpo vazio) | Implementar o avanço anual ou remover o trigger | Aniversários e datas recorrentes não geram o próximo marco | P |
| G29 | Proteção contra senha vazada (HIBP) | 🟨 PARCIAL | `20260721000044_todo_enable_hibp_password_check.sql:1-18` (placeholder `SELECT 1`) | Ação no Dashboard/Management API (`NAO_VERIFICADO`) | Contas podem usar senhas vazadas | P |
| G30 | Retenção de dados (job diário destrutivo) | 🟨 PARCIAL | `20260723112943_…sql:39-51` (interactions 1095 d, whatsapp 730 d…), `:94-95` (`DELETE` dinâmico), `:125` (cron); `data_retention_policies` sem leitor no front; sem teste SQL | UI de governança, dry-run, teste e backup antes do `DELETE` | Pode apagar o histórico comercial legado (>3 anos) sem visibilidade | P |
| G31 | Cobertura de testes SQL | 🟨 PARCIAL | `tests/rls/*.sql` (20) e `supabase/tests/*.sql` (1): 56/271 tabelas, 73/277 funções; `tests/rls/run.sh:11-13` (pula sem `PGHOST`) | Testes do rodízio, retenção, crons, ABM/RevOps/Intent/SMS/Sequências/Webhooks; CI com banco efêmero | Mudanças no motor de carteira e nas exclusões vão para produção sem rede de segurança | M |
| G32 | Agendamentos sem guarda e dump sem cron | 🟨 PARCIAL | `20260924213115_…sql:39-42` e `20260509173046_…sql:7` (`cron.schedule` sem checar a extensão); `scripts/migration/ddl/12_cron_jobs.sql:3` ("pg_cron não disponível na origem") | Inventariar `cron.job` no canônico e versionar o resultado | Não se sabe quais dos 19 jobs rodam em produção | P |
| G33 | Views públicas/legadas sem consumidor | ⬛ MORTO | `20260720000001_…:19,50`, `20260522142957_…:36,42,60`, `20260405111331_…:5`, `20260924181425_…:7`, `20260712215719_…:131`, `20260511172410_…:50` | Drop após a confirmação de que as RPCs substitutas cobrem tudo | Superfície exposta no PostgREST sem uso | P |
| G34 | Auditoria de recomendações de IA v2 | 🟨 PARCIAL | Uso em `src/hooks/useRecommendationAudit.ts:25` e `src/pages/RecommendationAudit.tsx:30`; DDL só em `scripts/migration/ddl/02_tables.sql:200-201`; marcada `service_only` em `20260723150429_…sql:33` | Migration com `CREATE TABLE` e grant de leitura via RLS | Tela de auditoria de IA pode falhar (tabela ausente ou 42501) | P |
| G35 | RPCs da allowlist sem DDL no repo (gamificação, tarefas, territórios, dashboards) | 🟨 PARCIAL | 94 de 137 em `supabase/functions/external-data/index.ts:20-100` (p.ex. `get_user_goals`, chamada em `src/hooks/useGamification.ts:76`; `create_task` em `src/hooks/useTasks.ts:137`) | Versionar as definições do canônico e testar | Metas/gamificação/tarefas dependem de código SQL que ninguém revisa no repo | M |
| G36 | Pipelines/estágios locais | ⬛ MORTO | `pipelines` (`20260512184042_…sql:2`) sem uso; `pipeline_stages` (`:13`) só lida por `move_to_pipeline_stage` (sem chamador, `20260720000005_…sql:177`); `pipeline_stage_transitions` sem escritor (`20260513143103_…sql:2`) | Decidir: modelo de pipelines configuráveis ou drop | Validação de transição de estágio sem regras cadastradas | P |
| G37 | Notificações persistidas | ⏰ / ⬛ | `notifications` (`20260720000023_…sql:7`) escrita só por `social-events-detector` (gated, `index.ts:350`) e `create_notification` (sem chamador); `notification_logs` só por `smart-notify` (cron quebrado) | Agendar os produtores ou consolidar em `smart_notifications` | Central de notificações fica sem eventos de social e lembretes | M |
| G38 | Detector de anomalias de conexões | ⬛ MORTO | `supabase/functions/connection-anomaly-detector/index.ts:161` (sem chamador ou cron); `src/hooks/useConnectionAnomalies.ts:45-73` (arquivo não alcançável) | Agendar e ligar a tela | Falhas de integração não geram alerta automático | P |

## Resumo numérico

| Categoria | Métrica |
|---|---|
| **Inventário** | 447 migrations. Estado final: 271 tabelas, 20 views, 0 MVs criadas no repo (2 apenas movidas), 277 funções, 194 triggers, 775 policies, 10 enums, 19 jobs `pg_cron`. 4 tabelas foram dropadas e recriadas; nenhuma termina dropada. |
| **Linhagem fora do repo** | 146 tabelas e 109 views do `types.ts` sem DDL; 57 relações lidas pelo front vivo só existem no canônico; 94 de 137 RPCs da allowlist sem DDL. |
| **Tabelas** (consumo, 270 de `public`) | 181 com escrita e leitura vivas; 15 sem nenhum consumidor; 26 lidas e sem produtor; 9 com produtor só em caminho morto; 10 só em caminho morto; 29 só escritas. |
| **Views** | 9 de 20 sem consumidor. |
| **Funções** | 93 sem chamador no repo: 57 sem nenhum, 24 só na allowlist do proxy, 5 de trigger sem trigger e 7 com consumidor externo declarado. Também: 5 que referenciam tabelas inexistentes e 2 RPCs chamadas por edge que não existem. |
| **Cron** | 19 jobs, 2 jobs HTTP quebrados e 0 desagendados. 23 edge functions com gate de cron, das quais 21 não têm agendador. 2 jobs que o próprio banco monitora nunca foram criados. |
| **Filas** | 11 de 15 sem worker funcional. |
| **`tabelas-ausentes`** | 119 listadas: 117 já com DDL nas migrations, 1 só no dump, 1 só nas migrations. 119 de 119 continuam fora do `types.ts`. |
| **Testes SQL** | 21 arquivos; citam 56/271 tabelas (20,7%) e 73/277 funções (26,4%); 13 domínios sem nenhum teste. |
| **Origem** | 114/114 tabelas, 1.494/1.494 colunas, 13/13 funções e 325/325 policies migradas. Triggers 61/61 equivalentes (13 renomeados). 0 jobs de cron exportados. |
| **Lacunas** | 38 no total, contadas pelo status principal: 💥 6 (G01, G02, G06, G11, G12, G13), 🔌 8, ⏰ 7, ❌ 1 (G09; mais o opt-out do G10), ⬛ 5, 🟨 11. Alguns IDs têm status composto. |

## Top 10 lacunas de maior impacto

1. **G03 — 21 edge functions de automação com gate de cron e sem agendador.** CS health, forecast, RevOps, lead score em lote, MQL, nurturing, sequências, SMS, weekly digest, DLQ e social sync estão parados, e 13 botões do front recebem 401.
2. **G05 — Rodízio de carteira sem fonte de compras.** `registrar_pedido_erp` não tem chamador e `customer_purchases` fica vazia, mas os crons estão agendados. Se o kill switch for ligado, há risco de redistribuir a carteira ativa.
3. **G06 — `REVOKE ALL` de `authenticated` em 66 tabelas, 32 delas lidas ou escritas diretamente pelo front.** O teste RLS afirma o contrário. Em ambiente novo, telas admin, de auditoria, lead score, sequências e atribuição quebram.
4. **G01 + G02 — Os dois únicos crons HTTP estão quebrados.** Apontam para ref errado, não enviam `x-cron-secret` e o do smart-notify tem um cast de jsonb inválido. Validação de contatos e notificações automáticas não rodam.
5. **G07 — O schema canônico não nasce do repositório.** Há duas linhagens e um ledger divergente ("nunca aplicadas aqui"). Nenhuma correção é reproduzível fora de produção.
6. **G09 — Campanhas de e-mail apenas simuladas.** Não há edge de envio e o status "sent" é falso.
7. **G30 — Retenção diária destrutiva** (interactions > 3 anos, WhatsApp > 2 anos) sem UI, sem dry-run e sem teste.
8. **G17 + G16 — 13 tabelas de "inteligência" lidas pela Ficha 360 e pelo painel de neuromarketing sem nenhum produtor.** As abas aparecem sempre vazias.
9. **G23 — 11 de 15 filas sem worker funcional.** Inclui o reprocessamento CRM, que não tem worker nem trigger.
10. **G31 — Testes SQL cobrem cerca de 20% das tabelas e 0% do motor de rodízio e da retenção.** O CI pula os testes sem `PGHOST`.
