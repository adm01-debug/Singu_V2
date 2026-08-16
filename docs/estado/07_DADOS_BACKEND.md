# Estado — Camada de Dados e Backend

> Auditoria estática do repositório `/home/user/singu-v2`.
> Escopo: `supabase/migrations/` (390 arquivos `.sql`, 28.245 linhas), `src/integrations/supabase/types.ts` (16.615 linhas, tipos gerados), `src/data/`.
> **Sem acesso ao banco em runtime.** Nenhuma afirmação sobre estado do banco (tabela vazia, migration aplicada, cron rodando) é feita neste documento. Onde o runtime seria necessário, está marcado `NAO_VERIFICADO`.

---

## Metodologia

A auditoria foi feita **por inventário (altitude), não por leitura linha a linha**. Motivo objetivo: 28.245 linhas de SQL excedem o teto de contexto utilizável; ler sequencialmente produziria cobertura parcial e conclusões enviesadas pelos primeiros arquivos lidos.

Procedimento aplicado:

1. **Normalização.** Os 390 `.sql` foram concatenados em dois artefatos derivados: (a) versão sem comentários (`sed 's/--.*//'`), para eliminar falsos positivos de frases como `-- Create table for emotional anchors`; (b) versão *achatada* (`tr '\n' ' '`), porque a maioria dos `CREATE POLICY` do repositório quebra linha antes do `ON public.<tabela>` — um grep linha a linha subcontava políticas em ~72% (186 tabelas detectadas vs. 296 reais).
2. **Inventário por objeto.** Extração por regex PCRE de `CREATE TABLE`, `CREATE FUNCTION`, `CREATE TRIGGER`, `CREATE VIEW`, `CREATE MATERIALIZED VIEW`, `CREATE POLICY`, `ALTER TABLE … ENABLE ROW LEVEL SECURITY`, `CREATE INDEX`, `CREATE TYPE`, `CREATE EXTENSION`, `CREATE SCHEMA`, `cron.schedule`, `cron.unschedule`, `DROP TABLE`.
3. **Diferenças de conjunto.** Todos os achados desta auditoria são `comm`/`diff` entre listas ordenadas (declarado × consumido × tipado). Nenhum achado depende de amostragem.
4. **Leitura dirigida.** Trechos específicos foram lidos apenas para confirmar achados já detectados pelo inventário (ex.: verificar se um `CREATE POLICY` órfão está ou não dentro de um bloco `DO $$ … IF EXISTS`).
5. **Consumo.** Corpus de 1.882 arquivos `.ts/.tsx/.js/.jsx` de `src/`, `supabase/functions/`, `tests/`, `e2e/`, `scripts/` (excluindo `types.ts` e `node_modules`, que está vazio). Para cada objeto, teste em **três formas de referência** (aspas simples, duplas, template literal) mais o padrão `.from(x)` e `.rpc('x')`, e ainda uma varredura solta por substring antes de declarar qualquer coisa órfã.

Ferramentas de build/test/lint **não** foram executadas (`node_modules` vazio, conforme restrição).

---

## Inventário quantitativo

Base para todos os comandos: `F` = concatenação dos 390 `.sql` sem comentários e achatada em linha única.

| Objeto | Nº | Critério / comando |
|---|---:|---|
| Arquivos de migration | **390** | `ls supabase/migrations/*.sql \| wc -l` |
| Linhas de SQL | **28.245** | `cat supabase/migrations/*.sql \| wc -l` (1.176.911 bytes) |
| **Tabelas distintas criadas** | **265** | `grep -ohiP "create\s+table\s+(if\s+not\s+exists\s+)?(public\.)?\"?[a-z_0-9]+" $F \| sed 's/.*[. ]//' \| sort -u`, descartando 1 falso positivo (`public.%I`, de `format()` em criação dinâmica de partição) |
| Ocorrências de `CREATE TABLE` | 304 | idem sem `sort -u` — a diferença (39) é recriação/`IF NOT EXISTS` repetido |
| **Funções/RPCs distintas** | **210** | `grep -ohiP "create\s+(or\s+replace\s+)?function\s+(public\.)?…"` + `sort -u` (264 ocorrências brutas → 54 são `CREATE OR REPLACE` de redefinição) |
| **Triggers distintos** | **251** | `grep -ohiP "create\s+(or\s+replace\s+)?trigger\s+\"?[a-z_0-9]+"` + `sort -u` |
| **Views (normais)** | **14** | `grep -ohiP "create\s+(or\s+replace\s+)?view\s+…"` + `sort -u` |
| **Materialized views** | **0** | `grep -rniP "CREATE\s+MATERIALIZED\s+VIEW" supabase/migrations/` → **zero ocorrências** (ver achado G-2) |
| **Políticas RLS** | **1.063** statements / **296** tabelas-alvo distintas | `grep -ohiP "create\s+policy\s" $F \| wc -l`; alvos via `…\s+on\s+(public\.)?<nome>` + `sort -u` |
| Tabelas com `ENABLE ROW LEVEL SECURITY` | **267** | `grep -ohiP "alter\s+table\s+…\s+enable\s+row\s+level\s+security"` + `sort -u` |
| **Índices distintos** | **541** (587 ocorrências) | `grep -ohiP "create\s+(unique\s+)?index\s+(concurrently\s+)?(if\s+not\s+exists\s+)?\"?[a-z_0-9]+"` + `sort -u` |
| Foreign keys (`REFERENCES`) | 284 | `grep -ohiP "\breferences\s+(public\.)?[a-z_0-9]+" $F \| wc -l` |
| Funções `SECURITY DEFINER` (ocorrências) | 199 | `grep -ohi 'security definer' $F \| wc -l` |
| **Extensões** | **6** | `pg_cron`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `unaccent` |
| **Enums (`CREATE TYPE`)** | **7** | `app_role`, `entity_relationship_role`, `entity_type`, `error_severity`, `passo_outcome`, `validation_kind`, `validation_queue_status` |
| Schemas criados | **2** | `extensions`, `reporting` (`grep -ohiP "create\s+schema…"`) |
| Schemas referenciados sem `CREATE SCHEMA` | **2** | `zapp_history` (24 refs), `_dormant` (10 refs) |
| **Jobs `cron.schedule`** | **15** statements / **15** jobs nomeados | `grep -rniP "cron\.schedule" supabase/migrations/*.sql` |
| `cron.unschedule` | 10 | idem — todos em par idempotente no mesmo arquivo |
| Tabelas em `types.ts` (gerado) | **266** | seção `Tables:` (linhas 5–14.331) |
| Views em `types.ts` | **111** | seção `Views:` (linhas 14.332–16.607) |
| **Funções em `types.ts`** | **1** | `src/integrations/supabase/types.ts:16609` — só `_postgrest_anon_placeholder` |
| **Enums em `types.ts`** | **0** | `src/integrations/supabase/types.ts:16611` — `Enums: { [_ in never]: never; }` |
| Tabelas alvo de `.from()` no app | **248** | `grep -rhoP "\.from\(\s*['\"\`]\K[a-z_0-9]+" src supabase/functions` + `sort -u` |
| Nomes de RPC em `.rpc()` | **54** (62 ocorrências) | `grep -rhoP "\.rpc\(\s*['\"\`]\K[a-z_0-9]+"` + `sort -u` |
| Arquivos em `src/data/` | 46 (17.113 linhas, 153 `export const`) | dados estáticos — **zero** referência a `supabase` |

---

## Tabela de estado por domínio de dados

Legenda de RLS: `E` = `ENABLE ROW LEVEL SECURITY` presente; `P` = pelo menos uma `CREATE POLICY`.
Coluna "Em `types.ts`?" indica se o domínio existe no contrato de tipos que o app compila (`createClient<Database>` em `src/integrations/supabase/client.ts:12`). **Não** é afirmação sobre o banco real.

| Domínio | Tabelas | Classificação | RLS | Consumido por (arquivo:linha) | Em `types.ts`? | Evidência / o que falta |
|---|---:|---|---|---|---|---|
| **Core CRM** (contacts, companies, deals, activities, tasks, interactions, notifications) | 7 | ✅ IMPLEMENTADO_TOTAL | E+P | `src/components/ficha-360/DadosPessoaisCard.tsx:120`, `src/components/pipeline/DealDetailDrawer.tsx:106`, `src/hooks/useTeamDashboard.ts:54`, `src/hooks/useActivityLogger.ts:26` | Sim | Único domínio íntegro nos 3 eixos. Falta índice em `contacts(email)` e `UNIQUE(email)` — grep por `create index … on public.contacts(…email…)` retorna vazio |
| **Pipeline** (pipelines, pipeline_stages, pipeline_stage_transitions, deal_forecasts) | 4 | 🟦 SUGERIDO_OU_INICIADO | E+P | **nenhum** — `pipelines`/`pipeline_stages`/`pipeline_stage_transitions` só aparecem em `types.ts` e no `.bak` | Parcial | Tabelas e políticas existem; nenhum hook/edge function consulta. `deals` usa `stage` textual (`src/hooks/useTeamDashboard.ts:54`) |
| **IA / Comportamental** (contact_personality, contact_behavior, disc_*, vak_*, metaprogram_*, neuro_*, brain_dominance, eq_*, reframing_*, emotional_*, cognitive_bias, psychographic, contact_analytical_profiles, behavioral_*) | ~40 | 🟨 PARCIAL | E+P | `src/hooks/useContactBehavior.ts:153`, `src/components/disc/DISCEvolutionTimeline.tsx:70`, `src/components/lead-score/LeadScoreWidget.tsx:39`, `src/pages/admin/InsightFeedbackAnalytics.tsx:192` | **Não** (15 de 23 `contact_*` ausentes) | Código consulta; contrato de tipos não conhece as tabelas. 5 tabelas `*_audit` órfãs. `neuro_pnl_sessions` órfã |
| **Marketing** (email_campaigns, campaign_recipients, sms_*, landing_pages, forms, form_submissions, lead_magnets, nurturing_*, sequences, sequence_*) | ~20 | 🟨 PARCIAL | E+P | `src/hooks/useEmailCampaigns.ts:38`, `src/hooks/useSmsCampaigns.ts:72`, `src/hooks/useForms.ts:62`, `src/hooks/useLandingPages.ts:54`, `src/hooks/useSequences.ts:72`, `src/hooks/useNurturingWorkflows.ts:50` | Parcial | `sms_*` e `rfm_*` estão em `types.ts`; `forms`, `form_submissions`, `lead_magnets`, `sequence_events`, `sequence_send_log`, `nurturing_executions` **não**. `nurturing_enrollments` órfã |
| **RevOps / Forecast** (revops_*, forecast_*, win_loss_*, attribution_*, deal_forecasts) | ~13 | 🟨 PARCIAL | E+P | `src/hooks/useRevOps.ts:74`, `src/hooks/useForecasting.ts:72`, `src/hooks/useWinLoss.ts:83` | **Não** (3/3 revops, 3/4 forecast, 3/3 win_loss ausentes) | Consumido só via hooks React; `attribution_models_cache` e `forecast_categories_history` órfãs |
| **Lead Scoring / Intent / MQL** (lead_score_*, lead_scores, intent_*, mql_*) | 13 | 🟨 PARCIAL | E+P | `src/hooks/useLeadScore.ts:220`, `src/hooks/useIntent.ts:65`, `src/hooks/useMQL.ts:90` | **Não** (10 de 13 ausentes) | Idem acima |
| **ABM** (abm_accounts, abm_account_plans, abm_buying_committee, abm_campaigns, abm_whitespace_opportunities) | 5 | 🟨 PARCIAL | E+P | `src/hooks/useABM.ts:97` + `supabase/functions/abm-account-scorer`, `abm-whitespace-analyzer` | **Não** (5/5 ausentes) | Domínio completo fora do contrato de tipos |
| **Customer Success** (cs_*, csat_surveys, churn_risk_scores, health_alerts, support_tickets, ticket_comments) | ~11 | 🟨 PARCIAL | E+P | `src/hooks/useCustomerSuccess.ts:95`, `src/hooks/useChurnRisk.ts:103`, `src/hooks/useSupportTickets.ts:47` | **Não** (5/5 `cs_*` ausentes) | — |
| **Deal Rooms / Documentos** (deal_room*, documents, document_templates, document_signatures, document_views) | 10 | 🟨 PARCIAL | E+P | `src/hooks/useDealRooms.ts:121` e `:343` | **Não** (6/6 `deal_room*` ausentes) | Views públicas (`document_signatures_public`) existem só nas migrations |
| **WhatsApp / Comunicação** (whatsapp_*, call_logs, evolution) | 8 | 🟨 PARCIAL | E+P | `src/hooks/useWhatsAppData.ts:16`, `src/hooks/useUnifiedHistory.ts:125` | Parcial (3 de 6 ausentes) | `whatsapp_ingestion_logs`, `whatsapp_messages_index`, `whatsapp_transcriptions`, `call_logs` fora de `types.ts` |
| **Social** (social_profiles, social_insights, social_behavior_analysis, social_life_events, social_sync_queue, social_consent_audit, social_scraping_schedule) | 7 | 🟨 PARCIAL | E+P | `src/hooks/useSocialIntelligence.ts:16` | Parcial (3 de 7) | `social_insights` criada tardiamente em `20260720000023_create_phantom_tables.sql:95` |
| **Admin / Segurança / RBAC** (user_roles, role_permissions, permissions, profiles, audit_log*, error_logs, ip_whitelist, geo_allowed_countries, login_attempts, webauthn_credentials, access_*, secret_rotation_log, feature_flags, system_config, city_whitelist) | ~20 | 🟨 PARCIAL | E+P (exceto `audit_log_default`) | `src/hooks/useRBAC.tsx:21`, `src/components/admin/AdminQuickActions.tsx:45`, `src/hooks/useFeatureFlag.ts:20` | Parcial | `login_attempts` e `city_whitelist` órfãs; `feature_flags`, `error_logs`, `system_config` fora de `types.ts` |
| **Observabilidade** (ai_gateway_metrics, rpc_perf_samples, rpc_plan_snapshots, query_telemetry, system_health_snapshots, schema_drift_alerts, mcp_tool_calls, system_alerts) | 8 | 🟨 PARCIAL | E+P | `supabase/functions/_shared/aiGatewayLogger.ts:26` | **Não** | Consumido só por edge functions; nenhum tipo gerado |
| **Conexões / Integrações** (connection_configs, connection_quotas, connection_anomalies, connection_test_logs, incoming_webhook*, lux_*) | ~10 | 🟨 PARCIAL | E+P | `src/hooks/useConnections.ts:50` | **Não** (4/4 `connection_*` ausentes) | 5 ADRs dedicados (`docs/adr/013`–`017`) para um módulo sem cobertura de tipos |
| **Validação / Enriquecimento** (validation_queue, email_verifications, email_finder_results, phone_validations) | 4 | 🟨 PARCIAL | E+P | `src/hooks/useValidationQueue.ts:26` | **Não** (4/4 ausentes) | Alimenta 3 dos 15 jobs de cron |
| **RFM / Segmentação** (rfm_analysis, rfm_history, rfm_metrics, rfm_segment_config) | 4 | ✅ IMPLEMENTADO_TOTAL | E+P | `src/components/contact-detail/ContactCommercialTab.tsx:54` | Sim (4/4) | Único domínio secundário íntegro nos 3 eixos |
| **Triggers de persuasão** (trigger_ab_tests, trigger_bundles, trigger_channel_effectiveness, trigger_intensity_history, trigger_usage_history) | 5 | 🟨 PARCIAL | E+P | via `src/data/trigger*.ts` (dados estáticos) | Sim (5/5) | `trigger_intensity_history` sem `CREATE POLICY` própria |
| **Retenção / Auditoria de dados** (data_retention_policies, `*_audit` ×8, interactions_audit, psychographic_audit_log) | ~12 | ⬛ MORTO_OU_ABANDONADO | E (parcial) | **nenhum** | Não | 8 das 24 tabelas órfãs. `data_retention_policies` só é lida pela função `apply_retention_policies()` do cron |
| **Caches** (search_products_cache, semantic_search_cache, conversational_search_cache, attribution_models_cache) | 4 | 🟦 SUGERIDO_OU_INICIADO | E+P | parcial | Não | `search_products_cache` e `attribution_models_cache` órfãs |
| **Marketing ROI / Analytics legado** (marketing_roi_data, marketing_campaign_stats, interaction_summaries, life_events_history, nlp_feedback) | 5 | ⬛ MORTO_OU_ABANDONADO | E+P | **nenhum** | Não | Órfãs em todos os testes de referência |
| **`src/data/` (dados estáticos, sem banco)** | 46 arquivos | 🟨 PARCIAL | n/a | 80 arquivos importam `@/data/*` | n/a | **16 arquivos nunca importados** (ver seção própria) |

---

## Tabelas sem RLS / sem política

### Criadas sem `ENABLE ROW LEVEL SECURITY` — 1

| Tabela | migration:linha | Avaliação |
|---|---|---|
| `audit_log_default` | `20260711152812_6c39e481-8892-4747-9d27-144b71b055e4.sql:75` | **Falso positivo aceitável.** É `PARTITION OF public.audit_log DEFAULT` (partição declarada em `…152812…sql:18` via `PARTITION BY RANGE (created_at)`). Em PostgreSQL a RLS da tabela-mãe governa a partição. Não é achado de segurança. |

### Criadas sem nenhuma `CREATE POLICY` — 1
Apenas `audit_log_default`, pelo mesmo motivo. **Todas as outras 264 tabelas criadas têm RLS habilitada e ao menos uma política.** Não há caso de "RLS ligada e zero políticas" (deny-all acidental) entre as tabelas que o repositório cria.

### Achado inverso — RLS habilitada em tabela que o repositório NÃO cria — 3

| Tabela | migration:linha | Situação |
|---|---|---|
| `asia_upload_mapping` | `20260720000006_db_perf_indexes_rls_cleanup.sql:14` | Sem `CREATE TABLE` em nenhuma das 390 migrations |
| `sm_upload_mapping` | `20260720000006_db_perf_indexes_rls_cleanup.sql` (mesmo bloco) | idem |
| `xbz_upload_mapping` | `20260720000006_db_perf_indexes_rls_cleanup.sql` (mesmo bloco) | idem |

As três existem em `src/integrations/supabase/types.ts`. Ver seção **Reconstruibilidade**.

---

## Tabelas órfãs (declaradas, não consultadas)

Critério: tabela com `CREATE TABLE` em migration e **zero** ocorrências em `src/` + `supabase/functions/` sob todas as formas testadas (`'x'`, `"x"`, `` `x` ``, `.from(x)`), confirmadas depois por varredura solta por substring. **24 de 265 (9,1%).**

| Tabela | Classificação | Observação |
|---|---|---|
| `pipelines` | 🟦 SUGERIDO_OU_INICIADO | Núcleo de pipeline nunca consultado; só aparece em `types.ts` |
| `pipeline_stages` | 🟦 | idem |
| `pipeline_stage_transitions` | 🟦 | Também sofre `DROP TABLE` (ver achados) |
| `login_attempts` | 🟦 | Tabela de segurança nunca lida pela aplicação |
| `city_whitelist` | 🟦 | Par de `geo_allowed_countries`/`ip_whitelist`, que **são** usadas |
| `data_retention_policies` | 🟨 | Não lida pelo app, mas lida pela função `apply_retention_policies()` (cron `apply-data-retention-daily`) |
| `interaction_summaries` | ⬛ MORTO_OU_ABANDONADO | — |
| `marketing_roi_data` | ⬛ | — |
| `nurturing_enrollments` | ⬛ | `nurturing_workflows` e `nurturing_executions` **são** usadas; a de matrícula não |
| `neuro_pnl_sessions` | ⬛ | `neuro_behavioral_history` é usada |
| `nlp_feedback` | ⬛ | — |
| `search_products_cache` | ⬛ | — |
| `attribution_models_cache` | ⬛ | `attribution_touchpoints` é usada |
| `forecast_categories_history` | ⬛ | — |
| `life_events_history` | ⬛ | `life_events` e `social_life_events` são usadas |
| `ai_recommendation_audit_logs` | ⬛ | O app usa `ai_recommendation_audit_logs_v2`, que **não tem `CREATE TABLE`** em migration nenhuma |
| `audit_log_default` | n/a | Partição técnica |
| `contact_cadence_audit` | ⬛ | Trilha de auditoria escrita por trigger, nunca lida |
| `contact_preferences_audit` | ⬛ | idem |
| `contact_relatives_audit` | ⬛ | idem |
| `contact_time_analysis_audit` | ⬛ | idem |
| `disc_analysis_history_audit` | ⬛ | idem |
| `interactions_audit` | ⬛ | idem |
| `reframing_analysis_audit` | ⬛ | idem |

Nota: as 7 tabelas `*_audit` têm views de leitura (`v_contact_behavior_audit`, `v_contact_personality_audit`, `v_contact_relatives_audit`, `v_life_events_audit`) que **também** não são consultadas por nenhum arquivo de aplicação. Escrita de auditoria sem consumidor.

### Arquivos de `src/data/` nunca importados — 16 de 46

`carnegieCriticismDetector`, `carnegieEagerWant`, `carnegieEmpathyTemplates`, `carnegieEncouragement`, `carnegieGenuineInterest`, `carnegieOwnershipTransfer`, `carnegieQuestionInfluence`, `carnegieStorytelling`, `carnegieTalkRatio`, `carnegieYesLadder`, `triggerBundles`, `triggerConflictsMatrix`, `triggerTemplatesMetaprograms`, `triggerTemplatesVAK`, `triggersAdvancedRelations`, `triggersExtendedData`.

Critério: `grep -rl "data/<basename>" src --include=*.ts --include=*.tsx` excluindo o próprio `src/data/` → 0 resultados. Classificação: ⬛ MORTO_OU_ABANDONADO (34,8% do diretório).

---

## RPCs órfãs

Critério: função com `CREATE FUNCTION` em migration e **zero** referência em (a) `.rpc('nome')` no app, (b) `EXECUTE FUNCTION nome` de algum `CREATE TRIGGER`, (c) chamada `PERFORM/SELECT public.nome(` dentro do próprio SQL, (d) job de cron. Depois, filtro adicional por substring solta no corpus da aplicação.

**75 de 210 funções (35,7%) sem nenhuma referência estrutural.** Destas, 19 aparecem como substring em algum arquivo do app (provável chamada indireta/tabela de nomes) e **56 não aparecem em lugar nenhum**:

`_connection_encryption_key`, `add_item_to_deal`, `bulk_add_tag`, `bulk_reassign_companies`, `bulk_update_companies`, `bulk_update_status`, `capture_rpc_plan`, `check_at_risk_contacts`, `check_behavioral_regen_cron_staleness`, `cleanup_old_data`, `cleanup_old_health_snapshots`, `clone_company`, `clone_workflow_setup`, `complete_reminder`, `create_economic_group`, `create_notification`, `create_smart_reminder`, `create_template`, `create_webhook`, `decrypt_connection_config`, `definir_como_filial`, `definir_hierarquia_cooperativa`, `encrypt_connection_config`, `enqueue_crm_reprocess`, `enqueue_smart_notification`, `generate_daily_digest`, `generate_pre_contact_briefing`, `generate_rapport_suggestions`, `get_notification_summary`, `get_system_config_num`, `get_team_member_ids`, `get_top_slow_rpcs`, `log_activity`, `merge_duplicate_companies`, `move_to_pipeline_stage`, `onboard_new_company`, `record_nps_response`, **`refresh_daily_kpis`**, **`refresh_daily_stats`**, `remove_company_tag`, `remove_tag`, `resolve_alerts_batch`, `respond_to_proposal`, `restore_company`, `search_contacts_by_nlp`, `seed_deal_room`, `seed_playbook_defaults`, `singu_delete`, `singu_insert`, `singu_query`, `singu_update`, `update_company_partial`, `update_company_status`, `update_deal_amount`, `update_deal_status`, `vincular_empresa_grupo`.

Destaques:

- **`refresh_daily_kpis` / `refresh_daily_stats`** (`20260721000061_fix_mv_refresh_functions.sql:14` e `:25`) fazem `REFRESH MATERIALIZED VIEW CONCURRENTLY reporting.mv_daily_kpis/mv_daily_stats`. **Nenhum job de cron as agenda** e nenhum código as chama. As materialized views que elas atualizam **não são criadas por migration nenhuma** (achado G-2). Ou seja: função de refresh sem agendador, sobre objeto sem definição.
- **`singu_query` / `singu_insert` / `singu_update` / `singu_delete`** — quádrupla genérica de acesso ao banco, hardened em 4 migrations (`20260721000068_fix_singu_user_impersonation.sql` entre elas) e nunca chamada. Superfície `SECURITY DEFINER` mantida sem consumidor.
- Um bloco inteiro de CRUD de empresa (`create_economic_group`, `definir_como_filial`, `definir_hierarquia_cooperativa`, `vincular_empresa_grupo`, `bulk_reassign_companies`) pertence ao vocabulário do banco "Singu v2" (grupos econômicos, cooperativas), não ao CRM comportamental do restante do repo.

### RPCs chamadas pelo app sem `CREATE FUNCTION` no repositório — 4

| RPC | Chamada em | Existe em migration? |
|---|---|---|
| `get_territories` | `.rpc('get_territories')` em `src/` | **Não** |
| `get_territory_performance` | idem | **Não** |
| `increment` | idem | **Não** |
| `increment_workflow_completed` | idem | **Não** |

Nenhuma das quatro está em `types.ts` (que tem apenas o placeholder). Se a função existe no banco, é `NAO_VERIFICADO`; o repositório não a define.

---

## Jobs pg_cron

15 jobs. Todos os alvos SQL existem como função criada em alguma migration; os dois alvos HTTP existem como edge function no repositório. **Nenhum job aponta para função inexistente.**

| Nome | Schedule | Alvo | Alvo existe? | migration:linha |
|---|---|---|---|---|
| `validation-queue-drain` | `*/5 * * * *` | `net.http_post` → `/functions/v1/validation-queue-worker` | ✅ `supabase/functions/validation-queue-worker/` | `20260417120721_823eaa43-…sql:14` |
| `revalidate-stale-emails` | `0 4 * * *` | `INSERT INTO validation_queue` ← `email_verifications` | ✅ ambas as tabelas existem | `20260417120721_823eaa43-…sql:24` |
| `revalidate-stale-phones` | `30 4 * * *` | `INSERT INTO validation_queue` ← `phone_validations` | ✅ | `20260417120721_823eaa43-…sql:41` |
| `check-contact-health-daily` | `0 0 * * *` | `public.check_contact_health_alerts()` | ✅ `20260509172946_b942797e-…sql:118` | `20260509173046_0804c068-…sql:7` |
| `smart-notify-automation` | `0 */4 * * *` | `net.http_post` → `/functions/v1/smart-notify` | ✅ `supabase/functions/smart-notify/` | `20260512105729_9e0ffd45-…sql:6` |
| `cleanup-simulated-alerts-weekly` | `0 3 * * 0` | `public.cleanup_simulated_alerts()` | ✅ `20260713124628_449b2996-…sql:2` | `20260713124628_449b2996-…sql:28` |
| `mtta-sla-breach-auto-ack-hourly` | `7 * * * *` | `public.auto_ack_stale_mtta_sla_breaches()` | ✅ `20260715184735_158ce47d-…sql:2` | `20260715184735_158ce47d-…sql:31` |
| `mtta-auto-ack-heartbeat-watchdog` | `*/30 * * * *` | `public.check_mtta_auto_ack_heartbeat()` | ✅ `20260717142132_7f20a3a3-…sql:4` | `20260717142132_7f20a3a3-…sql:69` |
| `apply-data-retention-daily` | `15 3 * * *` | `public.apply_retention_policies()` | ✅ `20260723112943_04c3b77d-…sql:75` | `20260723112943_04c3b77d-…sql:125` |
| `ai-gateway-alerts-eval` | `*/5 * * * *` | `public.evaluate_ai_gateway_alerts()` | ✅ `20260723152932_9ebcb761-…sql:2` | `20260723152932_9ebcb761-…sql:93` |
| `auto_resolve_ai_gateway_alerts` | `2-59/5 * * * *` | `public.auto_resolve_ai_gateway_alerts()` | ✅ `20260723153336_b3712da2-…sql:102` | `20260723153336_b3712da2-…sql:178` |
| `ai-gateway-metrics-ensure-partition` | `15 3 * * *` | `public.ensure_ai_gateway_metrics_partition()` | ✅ `20260723154109_ad0a12c4-…sql:43` | `20260723154109_ad0a12c4-…sql:128` |
| `ai-gateway-metrics-drop-old` | `0 4 * * 0` | `public.drop_old_ai_gateway_metrics_partitions(90)` | ✅ `20260723154109_ad0a12c4-…sql:75` | `20260723154109_ad0a12c4-…sql:134` |
| `cleanup_rpc_perf_samples_daily` | `15 3 * * *` | `public.cleanup_rpc_perf_samples()` | ✅ `20260723154748_e54bdf5c-…sql:234` | `20260723154748_e54bdf5c-…sql:254` |
| `capture-degraded-rpc-plans` | `*/15 * * * *` | `public.capture_degraded_rpc_plans()` | ✅ `20260726144235_79b3bbdc-…sql:109` | `20260726144422_a6bd4ac3-…sql:3` |

### Achados nos jobs

- **[GRAVE] JWT anon hardcoded em migration versionada, apontando para um terceiro projeto.** `20260417120721_823eaa43-4b94-…sql:19` embute um `Authorization: Bearer eyJ…` cujo payload decodifica para `"ref":"rqodmqosrotmtrjnnjul"`. Esse ref **não é** o de `supabase/config.toml` (`project_id = "hjhthvzwtvwgdrochcam"`) nem o de `20260512105729_…sql:10` (`https://hjhthvzwtvwgdrochcam.supabase.co`). O repositório contém, portanto, **dois project refs distintos hardcoded** em jobs de cron, e um segredo em texto claro no histórico do git.
- Os 10 `cron.unschedule` estão todos no mesmo arquivo do `cron.schedule` correspondente (padrão idempotente `IF EXISTS … THEN unschedule … THEN schedule`). Nenhum job foi desativado sem reagendamento.
- Se os jobs estão de fato registrados no banco, e se já executaram: **`NAO_VERIFICADO`** (exige `SELECT * FROM cron.job` / `cron.job_run_details` em runtime).

---

## Drift: repo × tipos gerados — quantificado

Este é o achado central da auditoria.

### Os números

| Medida | Valor |
|---|---:|
| Tabelas criadas pelas migrations | 265 |
| Tabelas em `src/integrations/supabase/types.ts` | 266 |
| **Interseção** | **120** |
| Tabelas só nas migrations (invisíveis ao contrato de tipos) | **145** |
| Tabelas só em `types.ts` (sem `CREATE TABLE` no repo) | **145** |
| Views criadas pelas migrations | 14 |
| Views em `types.ts` | 111 |
| **Interseção de views** | **2** (`mv_daily_kpis`, `mv_daily_stats`) |
| Funções/RPCs criadas pelas migrations | 210 |
| Funções em `types.ts` | **1** (`_postgrest_anon_placeholder`, `types.ts:16609`) |
| Enums criados pelas migrations | 7 |
| Enums em `types.ts` | **0** (`types.ts:16611`) |

Sobreposição de tabelas: **120 / 291 nomes distintos = 41,2%**. Sobreposição de views: **2 / 123 = 1,6%**. Sobreposição de funções: **0,5%**.

### A explicação, com evidência

O repositório contém um segundo arquivo de tipos: `src/integrations/supabase/types.ts.lovable.bak` (15.691 linhas). Comparado com as migrations:

| Comparação | Tabelas em comum | Só no arquivo | Só nas migrations |
|---|---:|---:|---:|
| `types.ts.lovable.bak` × migrations | **262 / 265** | 14 (todas partições `audit_log_2026_*`, `ai_gateway_metrics_2026_*` — criadas dinamicamente por `format()`) | 3 (`notifications`, `social_insights`, `tasks`, criadas em `20260720000023_create_phantom_tables.sql`) |
| `types.ts` (atual) × migrations | **120 / 265** | 145 | 145 |

Views: o `.bak` tem 12 views, **todas** presentes nas migrations. O `types.ts` atual tem 111 views das quais **109 não existem no repositório**, com nomes de um domínio inteiramente distinto: `vw_carriers`, `vw_suppliers`, `vw_cooperativas_estrutura`, `vw_grupos_economicos_resumo`, `vw_carteira_sdr`, `vw_pix_accounts`, `staging_portal_sicoob`, `vw_carrier_homologation_queue`, `vw_supplier_qualification_dashboard`… — vocabulário de ERP de transportadoras/fornecedores, não de CRM comportamental.

`git log -1 -- src/integrations/supabase/types.ts` → **`c9b22b5` — "feat: Migração Banco Lovable para Supabase Singu v2"**, de 2026-08-04. A migration mais recente é `20260726154947`, de 2026-07-26.

**Conclusão sustentada por evidência:** `types.ts` foi regenerado a partir de um banco diferente ("Singu v2", projeto `hjhthvzwtvwgdrochcam`) cujo schema nunca foi capturado em migrations. O `.bak` é o contrato correspondente à cadeia de migrations. O repositório hoje descreve **dois schemas incompatíveis simultaneamente**.

### Consequência mensurável no código

| Medida | Valor |
|---|---:|
| Tabelas alvo de `.from()` no app | 248 |
| Dessas, **ausentes de `types.ts`** | **134** (54,0%) |
| Dessas 134, que **existem nas migrations** (contrato de tipos quebrado) | **127** |
| Dessas, que não existem **nem** nas migrations **nem** em `types.ts` | **8** — `ai_recommendation_audit_logs_v2`, `company`, `contact`, `email_logs`, `information_schema`, `interaction`, `migration_password_reset_log`, `whatsapp` (parte são fragmentos de string dinâmica) |
| Tabelas de `types.ts` sem migration que o app **realmente consulta** | **1** (`email_logs`) |
| Tabelas de `types.ts` sem migration **nunca** consultadas | **144** |
| Views de `types.ts` consultadas via `.from()` | **0 de 111** |

Ou seja: **127 tabelas que a aplicação consulta ativamente estão fora do contrato de tipos com que ela compila**, e **144 das 145 tabelas do contrato de tipos são código morto de tipagem**. Adicionalmente, com `Functions: { _postgrest_anon_placeholder }`, **todas as 62 chamadas `.rpc()` do app são não-tipadas** contra o `Database` gerado.

Se as queries falham em runtime contra o banco real: **`NAO_VERIFICADO`**.

---

## Reconstruibilidade do ambiente a partir do repositório

**Não. O banco não pode ser recriado apenas com `supabase/migrations/`** — e isso é demonstrável estaticamente, sem runtime.

### Prova 1 — statements não-guardados contra tabelas que nenhuma migration cria

**30 tabelas** recebem `CREATE POLICY` sem nunca receberem `CREATE TABLE`. **28 delas estão em `types.ts`** (isto é: existem no banco "Singu v2", e as migrations de hardening foram escritas *contra o banco vivo*, não contra a cadeia).

Verificado que os statements **não estão** protegidos por `DO $$ … IF EXISTS`:

```
20260721000085_fix_blanket_isnull_policies.sql:20  DROP POLICY IF EXISTS "activity_feed_all" ON public.activity_feed;
20260721000085_fix_blanket_isnull_policies.sql:21  CREATE POLICY "activity_feed_select" ON public.activity_feed
```

Num banco construído só a partir do repositório, a linha 21 aborta com `relation "public.activity_feed" does not exist`.

| Tabela | Primeira `CREATE POLICY` (migration:linha) |
|---|---|
| `contact_notes` | `20260721000028_fix_rls_user_private_tables.sql:15` |
| `meetings` | `20260721000028_fix_rls_user_private_tables.sql:87` |
| `proposals` | `20260721000028_fix_rls_user_private_tables.sql:107` |
| `quick_notes` | `20260721000028_fix_rls_user_private_tables.sql:143` |
| `reminders` | `20260721000028_fix_rls_user_private_tables.sql:161` |
| `user_badges` | `20260721000028_fix_rls_user_private_tables.sql:179` |
| `user_goals` | `20260721000028_fix_rls_user_private_tables.sql:197` |
| `automations` | `20260721000028_fix_rls_user_private_tables.sql:251` |
| `asia_upload_mapping` | `20260721000039_explicit_deny_rls_no_policy_tables.sql:23` |
| `sm_upload_mapping` | `20260721000039_explicit_deny_rls_no_policy_tables.sql:41` |
| `xbz_upload_mapping` | `20260721000039_explicit_deny_rls_no_policy_tables.sql:47` |
| `activity_feed` | `20260721000085_fix_blanket_isnull_policies.sql:21` |
| `cadence_enrollments` | `20260721000085_fix_blanket_isnull_policies.sql:33` |
| `commissions` | `20260721000085_fix_blanket_isnull_policies.sql:45` |
| `company_cadences` | `20260721000085_fix_blanket_isnull_policies.sql:57` |
| `favorites` | `20260721000085_fix_blanket_isnull_policies.sql:69` |
| `interaction_templates` | `20260721000085_fix_blanket_isnull_policies.sql:81` |
| `sales_goals` | `20260721000085_fix_blanket_isnull_policies.sql:129` |
| `scheduled_visits` | `20260721000085_fix_blanket_isnull_policies.sql:141` |
| `sla_violations` | `20260721000085_fix_blanket_isnull_policies.sql:177` |
| `territory_assignments` | `20260721000085_fix_blanket_isnull_policies.sql:249` |
| `workspace_accounts` | `20260721000085_fix_blanket_isnull_policies.sql:336` |
| `company_rfm_scores` | `20260721000085_fix_blanket_isnull_policies.sql:355` |
| `company_stakeholder_map` | `20260721000085_fix_blanket_isnull_policies.sql:370` |
| `relationship_score_history` | `20260721000085_fix_blanket_isnull_policies.sql:385` |
| `churn_predictions` | `20260721000087_wave173_idx_and_final_isnull_fix.sql:17` |
| `deal_velocity_analysis` | `20260721000087_wave173_idx_and_final_isnull_fix.sql:22` |
| `product_novelties` | `20260721000065_restrict_product_novelties_anon_read.sql:13` |

(mais `realtime` e `zapp_history`, que são schemas/objetos de outra origem)

**35 tabelas** recebem `CREATE INDEX` sem `CREATE TABLE` — 33 delas em `types.ts`: `calendar_events`, `campaign_members`, `carrier_evaluations`, `carrier_homologations`, `carrier_score_history`, `customer_health_scores`, `deal_competitors`, `economic_group_members`, `sales_opportunities`, `seller_daily_metrics`, `supplier_evaluations`, `supplier_score_history`, `behavioral_profile_queue`, entre outras.

**14 arquivos de migration** contêm ao menos um statement nessa condição.

### Prova 2 — objetos referenciados que nada cria

| Objeto | Referências | `CREATE` no repo |
|---|---:|---|
| Materialized view `reporting.mv_daily_kpis` | `ALTER MATERIALIZED VIEW … SET SCHEMA` (`20260721000055_…sql:25`), `REFRESH MATERIALIZED VIEW CONCURRENTLY` (`20260721000061_…sql:21`), `REVOKE/GRANT` (`20260721000042_…sql:10`) | **Nenhum.** `grep -rniP "CREATE\s+MATERIALIZED\s+VIEW" supabase/migrations/` → **0** |
| Materialized view `reporting.mv_daily_stats` | idem (`…000055:26`, `…000061:32`, `…000042:11`) | **Nenhum** |
| Schema `zapp_history` | 24 referências (`20260721000035_fix_auth_rls_initplan_dormant_zapp.sql:18`, `20260721000036_…sql:11`, `20260721000057_zapp_history_phone_to_contact_rls.sql`, `20260721000060_index_zapp_history_messages_company_id.sql`) | **Nenhum `CREATE SCHEMA`** |
| Schema `_dormant` | 10 referências (`20260721000035_…sql:18`, `20260721000053_drop_unused_indexes_dormant_zapp.sql`, `20260721000054_dormant_explicit_deny_all_policies.sql`) | **Nenhum `CREATE SCHEMA`** |

Só `extensions` e `reporting` têm `CREATE SCHEMA`.

### Prova 3 — ordenação destrutiva no histórico

`DROP TABLE` aparece para 4 objetos. O caso de `deals`:

- `20260317213221_22e14932-…sql:3` — `CREATE TABLE public.deals`
- `20260317213904_b7db91ad-…sql:1` — `DROP TABLE IF EXISTS public.deals CASCADE;` (13 minutos depois, arquivo cujo conteúdo é só essa linha)
- `20260512184042_fccf5358-…sql:24` — `CREATE TABLE public.deals` (≈2 meses depois)

Entre o drop e a recriação existem migrations que referenciam `deals`. Num replay linear, `CASCADE` derruba FKs/triggers/views dependentes e as migrations intermediárias falham.

### Prova 4 — o próprio repositório admite o problema

`supabase/migrations/20260720000023_create_phantom_tables.sql:1` abre com:

```
-- Create phantom tables referenced by edge functions but missing from migration history.
-- Covers: notifications, tasks, social_insights
```

Isto é, houve pelo menos um episódio anterior em que a cadeia de migrations não continha tabelas que o código usava, corrigido *a posteriori*.

### Veredito

- `supabase db reset` a partir de `supabase/migrations/` **falha** — em `20260721000028_fix_rls_user_private_tables.sql:15`, no mais tardar. Isso é dedutível do texto, não requer execução.
- Mesmo que se pulassem os erros, o resultado seria o schema **Lovable antigo** (265 tabelas), incompatível com o `types.ts` que a aplicação compila (266 tabelas, 120 em comum).
- **O ambiente não nasce do repositório.** O repositório é a união desconciliada de dois bancos.
- Se o banco `hjhthvzwtvwgdrochcam` hoje contém as tabelas das migrations, as do `types.ts`, ou as duas: **`NAO_VERIFICADO`**.

---

## Achados graves com migration:linha

| # | Severidade | Achado | Evidência |
|---|---|---|---|
| **G-1** | 🔴 CRÍTICA | **Drift total repo × tipos gerados.** Apenas 120 de 291 nomes de tabela coincidem (41,2%); 2 de 123 views (1,6%); 0 de 210 funções. `types.ts` foi gerado de um banco que o repositório não descreve. | `src/integrations/supabase/types.ts` (commit `c9b22b5`, 2026-08-04) × `supabase/migrations/` (último: 20260726); `src/integrations/supabase/types.ts.lovable.bak` bate 262/265 com as migrations |
| **G-2** | 🔴 CRÍTICA | **Duas materialized views são movidas de schema, refrescadas e têm privilégios revogados — mas nenhuma migration as cria.** | `20260721000055_materialized_views_to_reporting_schema.sql:25-26`; `20260721000061_fix_mv_refresh_functions.sql:21,32`; `20260721000042_revoke_anon_materialized_views.sql:10-11`. `grep -rniP "CREATE\s+MATERIALIZED\s+VIEW" supabase/migrations/` → 0 |
| **G-3** | 🔴 CRÍTICA | **Cadeia de migrations não replayável.** 30 tabelas recebem `CREATE POLICY` e 35 recebem `CREATE INDEX` sem nunca receberem `CREATE TABLE`; statements não-guardados, em 14 arquivos. | `20260721000028_fix_rls_user_private_tables.sql:15`; `20260721000085_fix_blanket_isnull_policies.sql:21`; `20260721000039_explicit_deny_rls_no_policy_tables.sql:23`; `20260721000087_wave173_idx_and_final_isnull_fix.sql:17` |
| **G-4** | 🔴 CRÍTICA | **Segredo em texto claro versionado + terceiro project ref.** JWT anon completo hardcoded num job de cron, com `"ref":"rqodmqosrotmtrjnnjul"` — diferente do `project_id` de `config.toml` e do ref usado em outro cron. | `20260417120721_823eaa43-a7a6-4be7-a046-ad763d7c5f03.sql:19` vs. `supabase/config.toml:1` (`hjhthvzwtvwgdrochcam`) vs. `20260512105729_9e0ffd45-…sql:10` |
| **G-5** | 🟠 ALTA | **Contrato de tipos quebrado em 127 tabelas ativamente consultadas.** 134 dos 248 alvos de `.from()` não existem em `types.ts`; 127 delas existem nas migrations. | `src/hooks/useABM.ts:97`, `src/hooks/useRevOps.ts:74`, `src/hooks/useDealRooms.ts:121`, `src/hooks/useConnections.ts:50`, `src/hooks/useCustomerSuccess.ts:95` — todos contra tabelas fora de `types.ts` |
| **G-6** | 🟠 ALTA | **Zero RPCs tipadas.** `Functions` do `Database` gerado contém só um placeholder; as 62 chamadas `.rpc()` do app não têm contrato. Enums também zerados (7 existem nas migrations). | `src/integrations/supabase/types.ts:16609` e `:16611` |
| **G-7** | 🟠 ALTA | **Dois schemas inteiros referenciados sem `CREATE SCHEMA`.** `zapp_history` (24 refs) e `_dormant` (10 refs) recebem políticas, índices e correções de `search_path`. | `20260721000035_fix_auth_rls_initplan_dormant_zapp.sql:18`; `20260721000057_zapp_history_phone_to_contact_rls.sql`; `20260721000060_index_zapp_history_messages_company_id.sql` |
| **G-8** | 🟠 ALTA | **`DROP TABLE public.deals CASCADE` sem recriação na mesma migration**, com ~2 meses de lacuna e migrations intermediárias que dependem de `deals`. | `20260317213221_…sql:3` → `20260317213904_b7db91ad-…sql:1` → `20260512184042_fccf5358-…sql:24` |
| **G-9** | 🟡 MÉDIA | **Funções de refresh de matview órfãs e não agendadas.** `refresh_daily_kpis`/`refresh_daily_stats` não são chamadas por cron nem por código; os objetos que refrescam não existem no repo. | `20260721000061_fix_mv_refresh_functions.sql:14,25`; ausentes dos 15 `cron.schedule` |
| **G-10** | 🟡 MÉDIA | **35,7% das funções sem consumidor** (75/210), das quais 56 sem qualquer menção. Inclui a quádrupla `singu_query/insert/update/delete`, mantida e endurecida em 4 migrations sem nunca ser chamada. | `20260721000068_fix_singu_user_impersonation.sql`; lista completa acima |
| **G-11** | 🟡 MÉDIA | **9,1% das tabelas órfãs** (24/265), incluindo o núcleo de pipeline (`pipelines`, `pipeline_stages`, `pipeline_stage_transitions`) e 8 trilhas de auditoria escritas por trigger e nunca lidas. | Seção "Tabelas órfãs" |
| **G-12** | 🟡 MÉDIA | **Sem índice e sem unicidade em `contacts(email)`.** `contacts` é a tabela mais consultada do sistema. | `grep -ohiP "create.*index.*on.*contacts\(.*email.*\)"` sobre as 390 migrations → 0 resultados |
| **G-13** | 🟢 BAIXA | **34,8% de `src/data/` morto** — 16 de 46 arquivos nunca importados. | `carnegie*` (10 arquivos), `trigger*` (6 arquivos) |

---

## Contradições com a documentação existente

### `docs/auditoria/04_ACHADOS_BANCO.md`

Auditoria anterior do mesmo escopo, com números incompatíveis com o estado atual do repositório:

| Afirmação do documento | Medição desta auditoria | Situação |
|---|---|---|
| "Migrations: **262**" | **390** | Documento defasado em 128 migrations |
| "Tabelas base (`public.`): **258** distintas (294 `CREATE TABLE`)" | **265** distintas (304 `CREATE TABLE`) | Defasado |
| "`CREATE POLICY`: **769**" | **1.063** | Defasado |
| "`CREATE INDEX`: **391**" | **587** ocorrências / 541 distintos | Defasado |
| "`CREATE TRIGGER`: **185**" | **251** distintos | Defasado |
| "Tabelas com `ENABLE ROW LEVEL SECURITY`: **257 / 258**" | **267** enables para 265 tabelas — 3 delas em tabelas que o repo não cria | O documento não detectou o excesso |
| **"Foi a *única* divergência entre os 222 nomes em `.from()` e o schema"** (sobre `social_insights`, achado BD-2) | **134 divergências** entre 248 nomes em `.from()` e `types.ts`; **127** entre `.from()`+migrations e `types.ts` | **Contradição direta e material.** O achado BD-2 tratava de 1 tabela; hoje o problema é sistêmico. `social_insights` inclusive foi resolvida em `20260720000023_create_phantom_tables.sql:95` |
| Nota metodológica: "schema **não** foi executado num banco" | idem | ✅ Coerente |

O documento anterior foi escrito **antes** do commit `c9b22b5` ("Migração Banco Lovable para Supabase Singu v2"), que substituiu `types.ts`. Nenhum documento em `docs/` registra o efeito dessa substituição sobre a camada de dados.

### `docs/DATABASE_ANALYSIS.md`

Contradições estruturais graves — o documento descreve **um sistema diferente**:

| Afirmação | Medição |
|---|---|
| Título: "Análise Exaustiva do Banco de Dados — **RelateIQ**" | O projeto é "SINGU" / "Singu v2"; `RelateIQ` não aparece em nenhuma migration |
| "Total de Tabelas: **51**" | **265** (5,2× a mais) |
| "Funções Database: **3**" | **210** (70× a mais) |
| "Triggers Ativos: **0** ⚠️" | **251** `CREATE TRIGGER` |
| "Foreign Keys: **0** ⚠️" | **284** `REFERENCES` |
| "Registros Totais: ~56 / Tamanho ~2,1 MB" | `NAO_VERIFICADO` — sem runtime, não é possível confirmar nem refutar contagens de linhas |
| Data: 03/02/2026 | Anterior a ~370 das 390 migrations |

`docs/DATABASE_ANALYSIS.md` deve ser tratado como **obsoleto**, não como referência.

### `docs/DATA_DICTIONARY.md` / `docs/data-dictionary.md` / `docs/er-diagram.md`

Não auditados em profundidade neste escopo. Dada a magnitude do drift (G-1), qualquer dicionário de dados anterior a 2026-08-04 descreve, na melhor hipótese, apenas o schema Lovable — 120 das 266 tabelas do contrato atual. **Verificação pendente.**

---

## Lacunas: o que NÃO verifiquei e por quê

Explicitamente **fora do alcance desta auditoria**, por ausência de runtime de banco:

1. **Se alguma migration foi aplicada.** Não há acesso a `supabase_migrations.schema_migrations`. Que as 390 migrations tenham rodado em `hjhthvzwtvwgdrochcam` (ou em qualquer banco) é **`NAO_VERIFICADO`**. Todo este documento fala do que o *texto* das migrations declara.
2. **Quais objetos existem de fato no banco.** As 145 tabelas presentes só em `types.ts` provavelmente existem no banco vivo (o gerador as leu de algum lugar), mas isso é inferência sobre a proveniência do arquivo, não medição. `NAO_VERIFICADO`.
3. **Se as 127 queries com contrato quebrado falham em runtime.** PostgREST resolve pelo schema real, não pelo `types.ts`; se a tabela existir no banco, a query funciona apesar do tipo ausente. `NAO_VERIFICADO`.
4. **Se algum job de pg_cron está registrado ou já executou.** Exigiria `cron.job` e `cron.job_run_details`. Verifiquei apenas que os alvos existem como texto no repositório. `NAO_VERIFICADO`.
5. **Contagem de linhas / tabelas vazias.** Nenhuma afirmação feita. `NAO_VERIFICADO`.
6. **Efetividade real das políticas RLS.** Contei 1.063 políticas e verifiquei cobertura (toda tabela criada tem ≥1). **Não** avaliei se as expressões `USING`/`WITH CHECK` são corretas, nem se há vazamento entre tenants. Isso exige leitura linha a linha do predicado de cada política e/ou testes em runtime — fora do método de inventário adotado.
7. **`SECURITY DEFINER` sem `SET search_path`.** Contei 199 ocorrências de `SECURITY DEFINER`, mas não pareei cada uma com seu `SET search_path` — a associação exige parsing de corpo de função, não regex. O documento anterior afirma 10 casos; **não confirmado nem refutado** aqui.
8. **Índices redundantes/duplicados.** 541 índices distintos inventariados; sobreposição de definição não avaliada (exigiria comparar listas de colunas). Há 4 migrations dedicadas a `drop_unused_indexes*` — sinal de que o problema é conhecido.
9. **Build / testes / lint.** Não executados: `node_modules` vazio, conforme restrição. Portanto **não** foi verificado se o `tsc` de fato quebra nas 127 tabelas fora de `types.ts` (o padrão `supabase as unknown as ...` observado em `src/hooks/useSocialInsights.ts` sugere que casts silenciam o compilador em pelo menos alguns pontos, mas o alcance disso é `NAO_VERIFICADO`).
10. **`supabase/functions/` (109 funções)** — inspecionadas apenas como *consumidoras* de tabelas/RPCs. Sua lógica interna, segurança e deploy pertencem a outro escopo da auditoria.
11. **Storage buckets e políticas de storage.** Detectadas referências (`20260721000043_harden_logos_bucket.sql`, `20260721000051_fix_logos_bucket_listing.sql`) mas não inventariadas.
12. **Ordem real de execução vs. ordem lexicográfica.** Assumi que o Supabase CLI aplica em ordem de nome de arquivo. Os prefixos `20260719000001`…`20260722000093` (numeração sequencial manual) convivem com `20260726154947_<uuid>` (numeração por timestamp da Lovable); a intercalação foi verificada apenas por ordenação de nome.
