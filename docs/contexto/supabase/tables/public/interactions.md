# public.interactions

> Histórico de interações com contatos/empresas

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 10 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_channel_stats, public.v_companies_metrics, public.v_company_summary, public.v_contact_summary, public.v_daily_kpis, public.v_dashboard_kpis, public.v_recent_interactions, public.vw_carteira_sdr, public.vw_churn_risk_ranking, public.vw_closing_score_alerts, public.vw_closing_score_ranking, public.vw_companies_stats, public.vw_contacts_sem_apelido, public.vw_interacoes_sem_apelido, public.vw_interaction_timeline, public.vw_pending_followups, public.vw_singu_contact_360, public.vw_singu_data_health, public.vw_singu_readiness, public.vw_singu_usage_kpis, reporting.mv_daily_kpis, reporting.mv_daily_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `channel` | `text` | não |  |  |  |
| 5 | `direction` | `text` | não |  |  |  |
| 6 | `status` | `text` | sim | `'concluido'::text` |  |  |
| 7 | `assunto` | `character varying(255)` | sim |  |  |  |
| 8 | `resumo` | `text` | sim |  |  |  |
| 9 | `conteudo` | `text` | sim |  |  |  |
| 10 | `data_interacao` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `data_agendada` | `timestamp with time zone` | sim |  |  |  |
| 12 | `duracao_segundos` | `integer` | sim |  |  |  |
| 13 | `usuario_responsavel_id` | `integer` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 15 | `anexos` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 16 | `external_id` | `character varying(100)` | sim |  |  |  |
| 17 | `source_system` | `character varying(50)` | sim |  |  |  |
| 18 | `bitrix_activity_id` | `integer` | sim |  |  |  |
| 19 | `sentiment` | `character varying(20)` | sim |  |  |  |
| 20 | `prioridade` | `character varying(20)` | sim |  |  |  |
| 21 | `requer_followup` | `boolean` | sim | `false` |  |  |
| 22 | `data_followup` | `timestamp with time zone` | sim |  |  |  |
| 23 | `followup_concluido` | `boolean` | sim | `false` |  |  |
| 24 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 25 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 26 | `created_by` | `uuid` | sim |  |  |  |
| 27 | `type` | `text` | sim |  |  |  |
| 28 | `title` | `text` | sim |  |  |  |
| 29 | `content` | `text` | sim |  |  |  |
| 30 | `audio_url` | `text` | sim |  |  |  |
| 31 | `transcription` | `text` | sim |  |  |  |
| 32 | `tags_array` | `text[]` | sim | `'{}'::text[]` |  |  |
| 33 | `duration` | `integer` | sim |  |  |  |
| 34 | `attachments` | `text[]` | sim | `'{}'::text[]` |  |  |
| 35 | `initiated_by` | `text` | sim |  |  |  |
| 36 | `response_time` | `integer` | sim |  |  |  |
| 37 | `key_insights` | `text[]` | sim | `'{}'::text[]` |  |  |
| 38 | `follow_up_required` | `boolean` | não | `false` |  |  |
| 39 | `follow_up_date` | `date` | sim |  |  |  |
| 40 | `emotion_analysis` | `jsonb` | sim |  |  |  |
| 41 | `user_id` | `uuid` | sim |  |  |  |
| 42 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |
| 43 | `outcome` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_interaction_target | CHECK | `CHECK (contact_id IS NOT NULL OR company_id IS NOT NULL)` |  |  | sim |
| chk_interactions_status | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'concluido'::text, 'cancelado'::text, 'agendado'::text]))` |  |  | sim |
| interactions_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| interactions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| interactions_initiated_by_check | CHECK | `CHECK (initiated_by = ANY (ARRAY['us'::text, 'them'::text]))` |  |  | sim |
| interactions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| interactions_type_check | CHECK | `CHECK (type = ANY (ARRAY['whatsapp'::text, 'call'::text, 'email'::text, 'meeting'::text, 'note'::text, 'social'::text, 'system'::text, 'commercial'::text, 'sdr_alert'::text]))` |  |  | sim |
| interactions_usuario_responsavel_id_fkey | FOREIGN KEY | `FOREIGN KEY (usuario_responsavel_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.cognitive_bias_history | cognitive_bias_history_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.cognitive_biases | cognitive_biases_detected_in_interaction_id_fkey | detected_in_interaction_id | NO ACTION |
| _dormant.contact_values | contact_values_discovered_in_interaction_id_fkey | discovered_in_interaction_id | NO ACTION |
| _dormant.decision_criteria | decision_criteria_discovered_in_interaction_id_fkey | discovered_in_interaction_id | NO ACTION |
| _dormant.disc_analysis_history | disc_analysis_history_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.disc_communication_logs | disc_communication_logs_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.disc_interaction_signals | disc_interaction_signals_interaction_id_fkey | interaction_id | CASCADE |
| _dormant.emotional_anchors | emotional_anchors_discovered_in_interaction_id_fkey | discovered_in_interaction_id | NO ACTION |
| _dormant.emotional_states | emotional_states_interaction_id_fkey | interaction_id | CASCADE |
| _dormant.emotional_states_history | emotional_states_history_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.eq_analysis_history | eq_analysis_history_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.hidden_objections | hidden_objections_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.insights | insights_interaction_id_fkey | interaction_id | CASCADE |
| _dormant.notifications | notifications_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.objections | objections_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.smart_reminders | smart_reminders_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.social_mentions | social_mentions_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.trigger_intensity_history | trigger_intensity_history_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.trigger_suggestions | trigger_suggestions_used_in_interaction_id_fkey | used_in_interaction_id | NO ACTION |
| _dormant.trigger_usage_log | trigger_usage_log_interaction_id_fkey | interaction_id | SET NULL |
| _dormant.vak_analysis_history | vak_analysis_history_interaction_id_fkey | interaction_id | SET NULL |
| public.activities | activities_interaction_id_fkey | interaction_id | SET NULL |
| public.alerts | alerts_interaction_id_fkey | interaction_id | CASCADE |
| public.cognitive_bias_history | cognitive_bias_history_interaction_id_fkey | interaction_id | NO ACTION |
| public.csat_surveys | csat_surveys_interaction_id_fkey | interaction_id | SET NULL |
| public.disc_analysis_history | disc_analysis_history_interaction_id_fkey | interaction_id | NO ACTION |
| public.disc_communication_logs | disc_communication_logs_interaction_id_fkey | interaction_id | NO ACTION |
| public.emotional_states_history | emotional_states_history_interaction_id_fkey | interaction_id | NO ACTION |
| public.eq_analysis_history | eq_analysis_history_interaction_id_fkey | interaction_id | NO ACTION |
| public.hidden_objections | hidden_objections_interaction_id_fkey | interaction_id | NO ACTION |
| public.metaprogram_analysis | metaprogram_analysis_interaction_id_fkey | interaction_id | NO ACTION |
| public.nlp_feedback | nlp_feedback_interaction_id_fkey | interaction_id | NO ACTION |
| public.trigger_intensity_history | trigger_intensity_history_interaction_id_fkey | interaction_id | SET NULL |
| public.vak_analysis_history | vak_analysis_history_interaction_id_fkey | interaction_id | SET NULL |
| zapp_history.conversation_daily_summaries | conversation_daily_summaries_interaction_id_fkey | interaction_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_interactions_channel | btree | channel | não | sim |  | `CREATE INDEX idx_interactions_channel ON public.interactions USING btree (channel)` |
| idx_interactions_company | btree | company_id | não | sim |  | `CREATE INDEX idx_interactions_company ON public.interactions USING btree (company_id)` |
| idx_interactions_company_created | btree | company_id, created_at | não | sim |  | `CREATE INDEX idx_interactions_company_created ON public.interactions USING btree (company_id, created_at DESC)` |
| idx_interactions_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_interactions_contact ON public.interactions USING btree (contact_id)` |
| idx_interactions_contact_created | btree | contact_id, created_at | não | sim |  | `CREATE INDEX idx_interactions_contact_created ON public.interactions USING btree (contact_id, created_at DESC)` |
| idx_interactions_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_interactions_contact_id ON public.interactions USING btree (contact_id)` |
| idx_interactions_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_interactions_created_at ON public.interactions USING btree (created_at DESC)` |
| idx_interactions_data | btree | data_interacao | não | sim |  | `CREATE INDEX idx_interactions_data ON public.interactions USING btree (data_interacao DESC)` |
| idx_interactions_followup_pending | btree | follow_up_date | não | sim | `((follow_up_date IS NOT NULL) AND (COALESCE(followup_concluido, false) = false))` | `CREATE INDEX idx_interactions_followup_pending ON public.interactions USING btree (follow_up_date) WHERE ((follow_up_date IS NOT NULL) AND (COALESCE(followup_concluido, false) = false))` |
| idx_interactions_followup_required_modern | btree | user_id, follow_up_date | não | sim | `((follow_up_required = true) AND (follow_up_date IS NOT NULL))` | `CREATE INDEX idx_interactions_followup_required_modern ON public.interactions USING btree (user_id, follow_up_date) WHERE ((follow_up_required = true) AND (follow_up_date IS NOT NULL))` |
| idx_interactions_initiated_by | btree | initiated_by | não | sim |  | `CREATE INDEX idx_interactions_initiated_by ON public.interactions USING btree (initiated_by)` |
| idx_interactions_pending_followup | btree | data_followup | não | sim | `((requer_followup = true) AND (followup_concluido = false))` | `CREATE INDEX idx_interactions_pending_followup ON public.interactions USING btree (data_followup) WHERE ((requer_followup = true) AND (followup_concluido = false))` |
| idx_interactions_status | btree | status | não | sim |  | `CREATE INDEX idx_interactions_status ON public.interactions USING btree (status)` |
| idx_interactions_type | btree | type | não | sim |  | `CREATE INDEX idx_interactions_type ON public.interactions USING btree (type)` |
| idx_interactions_updated_at | btree | updated_at | não | sim |  | `CREATE INDEX idx_interactions_updated_at ON public.interactions USING btree (updated_at)` |
| idx_interactions_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_interactions_user_created ON public.interactions USING btree (user_id, created_at DESC)` |
| idx_interactions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_interactions_user_id ON public.interactions USING btree (user_id)` |
| idx_interactions_usuario_responsavel_id | btree | usuario_responsavel_id | não | sim |  | `CREATE INDEX idx_interactions_usuario_responsavel_id ON public.interactions USING btree (usuario_responsavel_id)` |
| interactions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX interactions_pkey ON public.interactions USING btree (id)` |


## Policies (RLS)

### `Users can access their own interactions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own interactions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own interactions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own interactions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own interactions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `service_role_full_interactions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `singu_interactions_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_interactions_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `singu_interactions_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_interactions_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| a_singu_normalize_interactions | BEFORE | INSERT OR UPDATE | ROW | enabled | public.singu_interactions_compat_sync |
| audit_interactions | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| on_interaction_before_insert | BEFORE | INSERT | ROW | enabled | public.calculate_interaction_response_time |
| on_interaction_change | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_interactions_audit |
| on_interaction_created | AFTER | INSERT | ROW | enabled | public.sync_contact_last_interaction |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| tr_interaction_check_apelido | BEFORE | INSERT | ROW | enabled | public.check_apelido_on_interaction |
| tr_interaction_update_score | AFTER | INSERT | ROW | enabled | public.trigger_update_score_on_interaction |
| tr_sync_interaction_fields | BEFORE | INSERT OR UPDATE | ROW | enabled | public.sync_interaction_fields |
| tr_update_contact_metrics | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.calculate_relationship_metrics |
| tr_update_relationship_metrics | AFTER | INSERT OR UPDATE | ROW | enabled | public.update_contact_relationship_metrics |
| trg_enqueue_bpr_interactions | AFTER | INSERT | ROW | enabled | public.enqueue_behavioral_profile_regen |
| trg_interactions_set_created_at | BEFORE | INSERT | ROW | enabled | public.set_created_at |
| trg_log_interaction_activity | AFTER | INSERT | ROW | enabled | public.trigger_log_interaction_activity |
| trg_sequence_pause_on_reply | AFTER | INSERT | ROW | enabled | public.sequence_pause_on_interaction_reply |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
