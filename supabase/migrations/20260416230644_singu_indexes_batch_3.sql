-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416230644
-- nome:   singu_indexes_batch_3

CREATE UNIQUE INDEX IF NOT EXISTS lead_scores_contact_id_user_id_key ON public.lead_scores USING btree (contact_id, user_id);
CREATE INDEX IF NOT EXISTS idx_life_events_contact ON public.life_events USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_life_events_date ON public.life_events USING btree (event_date);
CREATE UNIQUE INDEX IF NOT EXISTS lux_webhook_config_entity_type_key ON public.lux_webhook_config USING btree (entity_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_summaries_interaction ON public.meeting_summaries USING btree (interaction_id);
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_contact ON public.metaprogram_analysis USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_user ON public.metaprogram_analysis USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS nurturing_enrollments_workflow_id_contact_id_key ON public.nurturing_enrollments USING btree (workflow_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_offer_suggestions_contact ON public.offer_suggestions USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_offer_suggestions_status ON public.offer_suggestions USING btree (status);
-- Skip: permissions_name_key já existe no destino
CREATE INDEX IF NOT EXISTS idx_purchase_history_contact ON public.purchase_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_user ON public.purchase_history USING btree (user_id);
-- Skip: push_subscriptions_user_id_endpoint_key já existe no destino
CREATE INDEX IF NOT EXISTS idx_query_telemetry_created_at ON public.query_telemetry USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_severity ON public.query_telemetry USING btree (severity);
CREATE INDEX IF NOT EXISTS idx_query_telemetry_user_id ON public.query_telemetry USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_redistribution_created ON public.redistribution_log USING btree (created_at DESC);
-- Skip idx_redistribution_reason: coluna reason pode não existir (na redistribution_log o nome é diferente)
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_contact ON public.rfm_analysis USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_scores ON public.rfm_analysis USING btree (recency_score, frequency_score, monetary_score);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_segment ON public.rfm_analysis USING btree (segment);
CREATE INDEX IF NOT EXISTS idx_rfm_analysis_user ON public.rfm_analysis USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS rfm_analysis_user_id_contact_id_key ON public.rfm_analysis USING btree (user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_rfm_history_contact ON public.rfm_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_rfm_history_recorded ON public.rfm_history USING btree (recorded_at);
CREATE INDEX IF NOT EXISTS idx_rfm_metrics_period ON public.rfm_metrics USING btree (user_id, period_start, period_end);
-- Skip: rfm_metrics_user_id_period_start_period_end_period_type_key já existe
CREATE UNIQUE INDEX IF NOT EXISTS rfm_segment_config_user_id_segment_key_key ON public.rfm_segment_config USING btree (user_id, segment_key);
-- Skip: role_permissions_role_permission_id_key já existe
CREATE INDEX IF NOT EXISTS idx_sales_team_active ON public.sales_team_members USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_sales_team_role ON public.sales_team_members USING btree (role);
CREATE INDEX IF NOT EXISTS idx_sales_team_user ON public.sales_team_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_schema_drift_entity ON public.schema_drift_alerts USING btree (entity_name, error_type);
-- idx_schema_drift_unresolved já existe
CREATE INDEX IF NOT EXISTS idx_score_history_calculated_at ON public.score_history USING btree (calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_composite ON public.score_history USING btree (contact_id, score_type, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_contact_id ON public.score_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_score_history_score_type ON public.score_history USING btree (score_type);
CREATE INDEX IF NOT EXISTS idx_score_history_user_id ON public.score_history USING btree (user_id);
-- Ajustado: gin_trgm_ops em schema public no destino
CREATE INDEX IF NOT EXISTS idx_search_products_desc_trgm ON public.search_products_cache USING gin (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_products_name_trgm ON public.search_products_cache USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_products_user ON public.search_products_cache USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_secret_rotation_name ON public.secret_rotation_log USING btree (secret_name, rotated_at DESC);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_lookup ON public.semantic_search_cache USING btree (user_id, query_hash, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS semantic_search_cache_user_id_query_hash_key ON public.semantic_search_cache USING btree (user_id, query_hash);
