-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260722001941
-- nome:   wave178_idx_remaining_unindexed_fks

-- Wave 178: Index remaining unindexed foreign keys in public schema
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_cadence_id ON public.cadence_enrollments (cadence_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON public.campaign_members (campaign_id);
CREATE INDEX IF NOT EXISTS idx_carrier_evaluations_carrier_id ON public.carrier_evaluations (carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_homologations_carrier_id ON public.carrier_homologations (carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_score_history_carrier_id ON public.carrier_score_history (carrier_id);
CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_company_id ON public.company_stakeholder_map (company_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_custom_field_id ON public.custom_field_values (custom_field_id);
CREATE INDEX IF NOT EXISTS idx_deal_competitors_deal_id ON public.deal_competitors (deal_id);
CREATE INDEX IF NOT EXISTS idx_economic_group_members_group_id ON public.economic_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON public.pipeline_stages (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_relationship_score_history_contact_id ON public.relationship_score_history (contact_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_visits_user_id ON public.scheduled_visits (user_id);
CREATE INDEX IF NOT EXISTS idx_seller_daily_metrics_user_id ON public.seller_daily_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_supplier_id ON public.supplier_evaluations (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_score_history_supplier_id ON public.supplier_score_history (supplier_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory_id ON public.territory_assignments (territory_id);
