-- Migration: remove_duplicate_indexes
-- Auditoria ao vivo (Management API, 14/11/2026): 18 índices exatamente duplicados
-- (mesma definição via pg_get_indexdef) identificados por pg_index + pg_stat_user_indexes.
-- Para cada par foi mantido o índice com maior uso (idx_scan) ou o nome canônico definido
-- nas migrations do repo; o redundante é dropado aqui.
-- CONSTRAINTs de unicidade (pg_constraint) não são tocadas.

-- whatsapp_messages: mantido idx_whatsapp_messages_company_id (1544 scans) e idx_whatsapp_messages_contact_id (1523)
DROP INDEX IF EXISTS public.idx_whatsapp_messages_company;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_contact;

-- churn_risk_scores: mantido idx_churn_risk_user (11118 scans)
DROP INDEX IF EXISTS public.idx_churn_risk_scores_user_id;

-- client_values: mantido idx_client_values_contact (2758 scans)
DROP INDEX IF EXISTS public.idx_client_val_contact;

-- decision_criteria: mantido idx_decision_criteria_contact (4195 scans)
DROP INDEX IF EXISTS public.idx_dec_crit_contact;

-- disc_analysis_history: mantido idx_disc_analysis_history_contact e idx_disc_analysis_history_user
DROP INDEX IF EXISTS public.idx_disc_analysis_contact;
DROP INDEX IF EXISTS public.idx_disc_analysis_history_user_id;

-- disc_communication_logs: mantido idx_disc_communication_logs_contact (4117 scans)
DROP INDEX IF EXISTS public.idx_disc_comm_contact;

-- document_signatures: mantido idx_document_signatures_user (2026 scans)
DROP INDEX IF EXISTS public.idx_document_signatures_user_id;

-- document_templates: mantido idx_document_templates_user (único rastreado em migrations do repo)
-- idx_document_templates_user_id NÃO é dropado: origem não rastreada (ausente nas migrations).

-- emotional_anchors: mantido idx_emotional_anchors_contact (4119 scans)
DROP INDEX IF EXISTS public.idx_emo_anchors_contact;

-- emotional_states_history: mantido idx_emotional_states_contact (4295 scans)
DROP INDEX IF EXISTS public.idx_emo_states_contact;

-- hidden_objections: mantido idx_hidden_objections_contact (4213 scans)
DROP INDEX IF EXISTS public.idx_objections_contact;

-- neuro_behavioral_history: mantido idx_neuro_history_contact_id (2188 scans)
DROP INDEX IF EXISTS public.idx_neuro_history_contact;

-- offer_suggestions: mantido idx_offer_suggestions_contact (2095 scans)
DROP INDEX IF EXISTS public.idx_offer_sug_contact;

-- sales/sales_activities: mantidos os índices canônicos criados nas migrations antigas;
-- os legacy_* criados em 20261012040000 são duplicados exatos.
DROP INDEX IF EXISTS public.legacy_sales_salesperson_scope_idx;
DROP INDEX IF EXISTS public.legacy_sales_activities_sale_scope_idx;
DROP INDEX IF EXISTS public.legacy_sales_activities_salesperson_scope_idx;

-- rpc_plan_snapshots: idx_rpc_plan_snapshots_changed tem predicado parcial (WHERE plan_changed),
-- NÃO é duplicado; ambos são mantidos.

-- search_products_cache: idx_search_products_user e idx_search_products_cache_user_id têm
-- origem não rastreada (ausentes nas migrations); nenhum é dropado.

-- system_health_snapshots: mantido idx_system_health_snapshots_timestamp (3 scans; nome rastreado)
DROP INDEX IF EXISTS public.idx_health_snapshots_timestamp_desc;