-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416230608
-- nome:   singu_indexes_batch_2

CREATE UNIQUE INDEX IF NOT EXISTS disc_profile_config_profile_type_key ON public.disc_profile_config USING btree (profile_type);
CREATE UNIQUE INDEX IF NOT EXISTS document_signatures_signature_token_key ON public.document_signatures USING btree (signature_token);
CREATE INDEX IF NOT EXISTS idx_document_signatures_status ON public.document_signatures USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_document_signatures_token ON public.document_signatures USING btree (signature_token);
CREATE INDEX IF NOT EXISTS idx_document_signatures_user ON public.document_signatures USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_user ON public.document_templates USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_document_views_signature ON public.document_views USING btree (signature_id);
CREATE INDEX IF NOT EXISTS idx_emotional_anchors_contact ON public.emotional_anchors USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_contact ON public.emotional_states_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_created ON public.emotional_states_history USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_analyzed_at ON public.eq_analysis_history USING btree (analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_contact_id ON public.eq_analysis_history USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_user_id ON public.eq_analysis_history USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS favorite_templates_user_id_template_id_key ON public.favorite_templates USING btree (user_id, template_id);
CREATE INDEX IF NOT EXISTS idx_favorite_templates_template_id ON public.favorite_templates USING btree (template_id);
CREATE INDEX IF NOT EXISTS idx_favorite_templates_user_id ON public.favorite_templates USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_handoff_created ON public.handoff_requests USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handoff_from ON public.handoff_requests USING btree (from_member_id);
CREATE INDEX IF NOT EXISTS idx_handoff_status ON public.handoff_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_handoff_to ON public.handoff_requests USING btree (to_member_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_health_settings ON public.health_alert_settings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_objections_contact ON public.hidden_objections USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_hidden_objections_resolved ON public.hidden_objections USING btree (resolved);
CREATE INDEX IF NOT EXISTS idx_insights_contact_id ON public.insights USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_lp_submissions_lp ON public.landing_page_submissions USING btree (landing_page_id);
CREATE INDEX IF NOT EXISTS idx_lp_submissions_user ON public.landing_page_submissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages USING btree (slug) WHERE (is_published = true);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user ON public.landing_pages USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_slug_key ON public.landing_pages USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON public.lead_assignments USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_contact ON public.lead_assignments USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created ON public.lead_assignments USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.lead_assignments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON public.lead_assignments USING btree (assignment_type);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON public.lead_routing_rules USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON public.lead_routing_rules USING btree (priority);
CREATE UNIQUE INDEX IF NOT EXISTS lead_score_config_user_id_key ON public.lead_score_config USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_contact ON public.lead_score_history USING btree (contact_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON public.lead_scores USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_grade ON public.lead_scores USING btree (grade);
CREATE INDEX IF NOT EXISTS idx_lead_scores_total ON public.lead_scores USING btree (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_user ON public.lead_scores USING btree (user_id);
