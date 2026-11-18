-- Migration: remove_duplicate_indexes (repo: 20261114124000_remove_duplicate_indexes.sql)
-- 18 indices exatamente duplicados; o gemeo identico e mantido em cada caso.
-- Verificado em 2026-11-18: nenhum sustenta constraint (pg_constraint.conindid).
DROP INDEX IF EXISTS public.idx_whatsapp_messages_company;
DROP INDEX IF EXISTS public.idx_whatsapp_messages_contact;
DROP INDEX IF EXISTS public.idx_churn_risk_scores_user_id;
DROP INDEX IF EXISTS public.idx_client_val_contact;
DROP INDEX IF EXISTS public.idx_dec_crit_contact;
DROP INDEX IF EXISTS public.idx_disc_analysis_contact;
DROP INDEX IF EXISTS public.idx_disc_analysis_history_user_id;
DROP INDEX IF EXISTS public.idx_disc_comm_contact;
DROP INDEX IF EXISTS public.idx_document_signatures_user_id;
DROP INDEX IF EXISTS public.idx_emo_anchors_contact;
DROP INDEX IF EXISTS public.idx_emo_states_contact;
DROP INDEX IF EXISTS public.idx_objections_contact;
DROP INDEX IF EXISTS public.idx_neuro_history_contact;
DROP INDEX IF EXISTS public.idx_offer_sug_contact;
DROP INDEX IF EXISTS public.legacy_sales_salesperson_scope_idx;
DROP INDEX IF EXISTS public.legacy_sales_activities_sale_scope_idx;
DROP INDEX IF EXISTS public.legacy_sales_activities_salesperson_scope_idx;
