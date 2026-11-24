# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-24 13:14 UTC

- **functions** alterado (8): `public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)`, `public.get_dashboard_data()`, `public.get_health_check()`, `public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer, p_executado_por_nome text)`, `public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)`, `public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)`, `public.singu_companies_compat_sync()`, `public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)`

## 2026-11-24 10:13 UTC

- **functions** alterado (12): `public.buyer_add_comment(_token text, _body text, _label text)`, `public.buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text)`, `public.get_buyer_document_path(_token text, _document_id uuid)`, `public.get_deal_room_by_token(_token text)`, `public.get_public_csat_survey(_token uuid)`, `public.increment_form_view(_slug text)`, `public.increment_landing_page_view(page_id uuid)`, `public.increment_magnet_view(_slug text)`, `public.record_buyer_view(_token text, _label text)`, `public.submit_public_csat_survey(_token uuid, _score integer, _feedback text)`, `public.submit_public_form(_slug text, _data jsonb, _utms jsonb, _page_url text, _user_agent text)`, `public.track_magnet_download(_slug text, _email text, _name text, _utms jsonb)`

## 2026-11-24 03:16 UTC

- **colunas** adicionado (12): `public.social_insights.contact_id`, `public.social_insights.content`, `public.social_insights.created_at`, `public.social_insights.id`, `public.social_insights.indicator_score`, `public.social_insights.insight_type`, `public.social_insights.metadata`, `public.social_insights.platform`, `public.social_insights.sentiment`, `public.social_insights.source_url`, `public.social_insights.updated_at`, `public.social_insights.user_id`
- **constraints** adicionado (3): `public.social_insights.social_insights_contact_id_fkey`, `public.social_insights.social_insights_pkey`, `public.social_insights.social_insights_user_id_fkey`
- **cron jobs** alterado (5): `1:zapp-generate-daily-summaries`, `2:zapp-process-pending-media`, `3:zapp-embed-pending-messages`, `4:zapp-curate-training-dataset`, `5:zapp-cleanup-expired-media`
- **grants** adicionado (2): `public.social_insights:authenticated`, `public.social_insights:service_role`
- **indexes** adicionado (5): `public.social_insights_contact_id_idx`, `public.social_insights_contact_id_platform_idx`, `public.social_insights_created_at_idx`, `public.social_insights_pkey`, `public.social_insights_user_id_idx`
- **lints** adicionado (4): `policy_auth_fn_not_wrapped:public.social_insights.social_insights_delete_own`, `policy_auth_fn_not_wrapped:public.social_insights.social_insights_insert_own`, `policy_auth_fn_not_wrapped:public.social_insights.social_insights_select_own`, `policy_auth_fn_not_wrapped:public.social_insights.social_insights_update_own`
- **migrations** adicionado (1): `20261124120000_`
- **policies (RLS)** adicionado (4): `public.social_insights.social_insights_delete_own`, `public.social_insights.social_insights_insert_own`, `public.social_insights.social_insights_select_own`, `public.social_insights.social_insights_update_own`
- **tabelas** adicionado (1): `public.social_insights`

## 2026-11-24 01:14 UTC

- **functions** alterado (7): `public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)`, `public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer, p_executado_por_nome text)`, `public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)`, `public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)`, `public.search_companies(search_term text, max_results integer)`, `public.search_contacts(search_term text, max_results integer)`, `public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)`
- **migrations** adicionado (1): `20261121154000_revoke_anon_exec_stubs_crm`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_20`

## 2026-11-24 00:29 UTC

- **functions** alterado (10): `public.auto_atualizar_nomes_contato()`, `public.auto_preencher_nomes_contato()`, `public.claim_behavioral_profile_retry(p_contact_id uuid, p_actor_id uuid)`, `public.handle_new_user()`, `public.has_role(_user_id uuid, _role app_role)`, `public.search_companies(search_term text, max_results integer)`, `public.search_contacts(search_term text, max_results integer)`, `public.to_title_case_pt(s text)`, `public.update_company_search_vector()`, `public.update_contact_search_vector()`
- **migrations** adicionado (2): `20261120153000_fix_handle_new_user_trigger_email`, `20261123200000_fix_claim_behavioral_profile_retry_admin_check`
- **policies (RLS)** adicionado (8): `public.company_cnaes.company_cnaes_owner_or_admin_mfa_all`, `public.company_territories.company_territories_owner_or_admin_mfa_select`, `public.competitive_losses.competitive_losses_owner_or_admin_mfa_select`, `public.customer_health_scores.customer_health_scores_owner_or_admin_mfa_select`, `public.customer_surveys.customer_surveys_owner_or_admin_mfa_select`, `public.deal_items.deal_items_owner_or_admin_mfa_select`, `public.nps_surveys.nps_surveys_owner_or_admin_mfa_all`, `public.sales_opportunities.sales_opportunities_owner_or_admin_mfa_select`
- **policies (RLS)** removido (8): `public.company_cnaes.company_cnaes_all`, `public.company_territories.Authenticated read`, `public.competitive_losses.Authenticated read`, `public.customer_health_scores.Authenticated read`, `public.customer_surveys.Authenticated read`, `public.deal_items.Authenticated read`, `public.nps_surveys.nps_surveys_all`, `public.sales_opportunities.Authenticated read`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_27`

## 2026-11-23 23:13 UTC

- **functions** alterado (2): `public.has_role(_user_id uuid, _role app_role)`, `public.track_magnet_download(_slug text, _email text, _name text, _utms jsonb)`
- **lints** adicionado (1): `rls_no_policies:public._stg_pac_nums`
- **lints** removido (1): `rls_disabled:public._stg_pac_nums`
- **policies (RLS)** adicionado (40): `public.automation_executions.automation_executions_owner_or_admin_mfa_select`, `public.carrier_evaluations.carrier_evaluations_owner_or_admin_mfa`, `public.carrier_homologations.carrier_homologations_owner_or_admin_mfa`, `public.carrier_qualification_config.carrier_qualification_config_admin_write`, `public.carrier_qualification_config.carrier_qualification_config_authenticated_read`, `public.carrier_score_history.carrier_score_history_owner_or_admin_mfa`, `public.carrier_scores.carrier_scores_owner_or_admin_mfa`, `public.carriers.carriers_owner_or_admin_mfa`, `public.company_social_media.company_social_media_owner_or_admin_mfa`, `public.contact_addresses.contact_addresses_owner_or_admin_mfa`, `public.contact_family_history.contact_family_history_owner_or_admin_mfa_insert`, `public.contact_family_history.contact_family_history_owner_or_admin_mfa_select`, `public.contact_social_media.contact_social_media_owner_or_admin_mfa`, `public.crm_objection_intelligence.crm_objection_intelligence_contact_owner_or_admin`, `public.customer_events.customer_events_admin_mfa_insert`, `public.customer_events.customer_events_owner_or_admin_mfa_select`, `public.customer_ownership_history.customer_ownership_history_admin_mfa_delete`, `public.customer_ownership_history.customer_ownership_history_admin_mfa_insert`, `public.customer_ownership_history.customer_ownership_history_admin_mfa_update`, `public.customer_ownership_history.customer_ownership_history_owner_or_admin_mfa_select`, `public.customer_sdr_history.customer_sdr_history_admin_mfa_delete`, `public.customer_sdr_history.customer_sdr_history_admin_mfa_insert`, `public.customer_sdr_history.customer_sdr_history_admin_mfa_update`, `public.customer_sdr_history.customer_sdr_history_owner_or_admin_mfa_select`, `public.import_jobs.import_jobs_owner_or_admin_mfa`, `public.integration_logs.integration_logs_owner_admin_mfa_all`, `public.integrations.integrations_owner_admin_mfa_all`, `public.report_executions.report_executions_owner_or_admin_mfa`, `public.scheduled_reports.scheduled_reports_owner_or_admin_mfa`, `public.secret_rotation_log.secret_rotation_admin_mfa_all`, `public.supplier_evaluations.supplier_evaluations_owner_or_admin_mfa`, `public.supplier_homologations.supplier_homologations_owner_or_admin_mfa`, `public.supplier_qualification_config.supplier_qualification_config_admin_write`, `public.supplier_qualification_config.supplier_qualification_config_authenticated_read`, `public.supplier_score_history.supplier_score_history_owner_or_admin_mfa_insert`, `public.supplier_score_history.supplier_score_history_owner_or_admin_mfa_select`, `public.supplier_scores.supplier_scores_owner_or_admin_mfa`, `public.suppliers.suppliers_owner_or_admin_mfa`, `public.webhook_logs.webhook_logs_owner_admin_mfa_all`, `public.webhooks.webhooks_owner_admin_mfa_all`
- **policies (RLS)** removido (86): `public.automation_executions.Authenticated read`, `public.carrier_evaluations.carrier_evaluations_delete`, `public.carrier_evaluations.carrier_evaluations_insert`, `public.carrier_evaluations.carrier_evaluations_select`, `public.carrier_evaluations.carrier_evaluations_update`, `public.carrier_homologations.carrier_homologations_delete`, `public.carrier_homologations.carrier_homologations_insert`, `public.carrier_homologations.carrier_homologations_select`, `public.carrier_homologations.carrier_homologations_update`, `public.carrier_qualification_config.carrier_qual_config_delete`, `public.carrier_qualification_config.carrier_qual_config_insert`, `public.carrier_qualification_config.carrier_qual_config_select`, `public.carrier_qualification_config.carrier_qual_config_update`, `public.carrier_score_history.carrier_score_history_delete`, `public.carrier_score_history.carrier_score_history_insert`, `public.carrier_score_history.carrier_score_history_select`, `public.carrier_score_history.carrier_score_history_update`, `public.carrier_scores.carrier_scores_delete`, `public.carrier_scores.carrier_scores_insert`, `public.carrier_scores.carrier_scores_select`, `public.carrier_scores.carrier_scores_update`, `public.carriers.carriers_delete`, `public.carriers.carriers_insert`, `public.carriers.carriers_select`, `public.carriers.carriers_update`, `public.company_social_media.company_social_media_delete`, `public.company_social_media.company_social_media_insert`, `public.company_social_media.company_social_media_select`, `public.company_social_media.company_social_media_update`, `public.contact_addresses.contact_addresses_all`, `public.contact_family_history.Users can insert family history`, `public.contact_family_history.Users can insert their contact family history`, `public.contact_family_history.Users can view family history for their contacts`, `public.contact_family_history.Users can view their contact family history`, `public.contact_social_media.contact_social_media_delete`, `public.contact_social_media.contact_social_media_insert`, `public.contact_social_media.contact_social_media_select`, `public.contact_social_media.contact_social_media_update`, `public.crm_objection_intelligence.Enable all for authenticated users`, `public.crm_objection_intelligence.System can manage objection intelligence` … (+46)
- **tabelas** alterado (1): `public._stg_pac_nums`

## 2026-11-23 13:15 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_19`

## 2026-11-23 11:13 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_26`

## 2026-11-22 13:12 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_18`

## 2026-11-22 12:17 UTC

- **functions** alterado (1): `public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_25`

## 2026-11-21 19:11 UTC

- **colunas** adicionado (2): `public._stg_pac_nums.id`, `public._stg_pac_nums.numero`
- **colunas** removido (73): `public.vw_suppliers.bitrix_company_id`, `public.vw_suppliers.categoria`, `public.vw_suppliers.cidade`, `public.vw_suppliers.classificacao`, `public.vw_suppliers.cnpj`, `public.vw_suppliers.created_at`, `public.vw_suppliers.data_homologacao`, `public.vw_suppliers.email`, `public.vw_suppliers.estado`, `public.vw_suppliers.homologado`, `public.vw_suppliers.homologation_status`, `public.vw_suppliers.homologation_validade`, `public.vw_suppliers.id`, `public.vw_suppliers.perfil_preco`, `public.vw_suppliers.phone`, `public.vw_suppliers.score_geral`, `public.vw_suppliers.segment_code`, `public.vw_suppliers.tem_integracao`, `public.vw_suppliers.tipo_fornecedor`, `public.vw_suppliers.title`, `public.vw_suppliers.total_avaliacoes`, `public.vw_suppliers.trend`, `public.vw_suppliers.ultima_avaliacao`, `public.vw_suppliers_completo.api_url`, `public.vw_suppliers_completo.capital_social`, `public.vw_suppliers_completo.categoria`, `public.vw_suppliers_completo.cidade`, `public.vw_suppliers_completo.classificacao`, `public.vw_suppliers_completo.cnpj`, `public.vw_suppliers_completo.company_id`, `public.vw_suppliers_completo.company_status`, `public.vw_suppliers_completo.company_title`, `public.vw_suppliers_completo.created_at`, `public.vw_suppliers_completo.data_homologacao`, `public.vw_suppliers_completo.email_principal`, `public.vw_suppliers_completo.estado`, `public.vw_suppliers_completo.forma_pagamento`, `public.vw_suppliers_completo.grupo_economico`, `public.vw_suppliers_completo.homologado`, `public.vw_suppliers_completo.homologation_avaliador` … (+33)
- **colunas** alterado (1): `public.profiles.nlp_profile`
- **constraints** adicionado (1): `public._stg_pac_nums._stg_pac_nums_pkey`
- **functions** removido (1): `public.update_nlp_updated_at_column()`
- **functions** alterado (23): `public.assert_customer_access(p_customer_id uuid)`, `public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)`, `public.auto_atualizar_nomes_contato()`, `public.auto_preencher_nomes_contato()`, `public.extrair_nome_tratamento(p_first_name text)`, `public.extrair_nome_tratamento(p_full_name text, p_first_name text)`, `public.gerar_assinatura(p_first_name text, p_last_name text)`, `public.get_company_statistics()`, `public.get_contact_statistics(p_contact_id uuid, p_user_id uuid)`, `public.get_customer_statistics()`, `public.get_dashboard_data()`, `public.get_economic_group_statistics()`, `public.get_health_check()`, `public.get_pipeline_statistics()`, `public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer, p_executado_por_nome text)`, `public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)`, `public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)`, `public.search_companies(search_term text, max_results integer)`, `public.search_contacts(search_term text, max_results integer)`, `public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)`, `public.update_company_search_vector()`, `public.update_contact_search_vector()`, `public.update_updated_at_column()`
- **grants** adicionado (2): `public._stg_pac_nums:authenticated`, `public._stg_pac_nums:service_role`
- **grants** removido (4): `public.vw_suppliers:authenticated`, `public.vw_suppliers:service_role`, `public.vw_suppliers_completo:authenticated`, `public.vw_suppliers_completo:service_role`
- **indexes** adicionado (25): `public._stg_pac_nums_pkey`, `public.idx_cognitive_bias_history_analyzed_at`, `public.idx_cognitive_bias_history_contact_id`, `public.idx_communication_preferences_contact`, `public.idx_contact_relatives_contact_id`, `public.idx_contact_time_analysis_contact`, `public.idx_eq_analysis_history_contact_id`, `public.idx_favorite_templates_template_id`, `public.idx_favorite_templates_user_id`, `public.idx_life_events_date`, `public.idx_metaprogram_analysis_contact`, `public.idx_metaprogram_analysis_user`, `public.idx_purchase_history_contact`, `public.idx_purchase_history_user`, `public.idx_rfm_history_recorded`, `public.idx_rfm_metrics_period`, `public.idx_score_history_calculated_at`, `public.idx_score_history_composite`, `public.idx_score_history_contact_id`, `public.idx_score_history_score_type`, `public.idx_trigger_intensity_history_user_contact`, `public.idx_trigger_usage_history_contact_id`, `public.idx_trigger_usage_history_used_at`, `public.idx_vak_analysis_contact`, `public.idx_vak_analysis_user`
- **lints** adicionado (169): `policy_auth_fn_not_wrapped:public.activities.Users can delete their own activities`, `policy_auth_fn_not_wrapped:public.activities.Users can update their own activities`, `policy_auth_fn_not_wrapped:public.client_values.Users can create their own client values`, `policy_auth_fn_not_wrapped:public.client_values.Users can delete their own client values`, `policy_auth_fn_not_wrapped:public.client_values.Users can update their own client values`, `policy_auth_fn_not_wrapped:public.client_values.Users can view their own client values`, `policy_auth_fn_not_wrapped:public.cognitive_bias_history.Users can create their own cognitive bias history`, `policy_auth_fn_not_wrapped:public.cognitive_bias_history.Users can delete their own cognitive bias history`, `policy_auth_fn_not_wrapped:public.cognitive_bias_history.Users can update their own cognitive_bias_history`, `policy_auth_fn_not_wrapped:public.cognitive_bias_history.Users can view their own cognitive bias history`, `policy_auth_fn_not_wrapped:public.communication_preferences.Users can delete their own communication preferences`, `policy_auth_fn_not_wrapped:public.communication_preferences.Users can insert their own communication preferences`, `policy_auth_fn_not_wrapped:public.communication_preferences.Users can update their own communication preferences`, `policy_auth_fn_not_wrapped:public.communication_preferences.Users can view their own communication preferences`, `policy_auth_fn_not_wrapped:public.compatibility_alerts.Users can create their own compatibility alerts`, `policy_auth_fn_not_wrapped:public.compatibility_alerts.Users can delete their own compatibility alerts`, `policy_auth_fn_not_wrapped:public.compatibility_alerts.Users can update their own compatibility alerts`, `policy_auth_fn_not_wrapped:public.compatibility_alerts.Users can view their own compatibility alerts`, `policy_auth_fn_not_wrapped:public.compatibility_settings.Users can create their own compatibility settings`, `policy_auth_fn_not_wrapped:public.compatibility_settings.Users can delete their own compatibility_settings`, `policy_auth_fn_not_wrapped:public.compatibility_settings.Users can update their own compatibility settings`, `policy_auth_fn_not_wrapped:public.compatibility_settings.Users can view their own compatibility settings`, `policy_auth_fn_not_wrapped:public.contact_cadence.Users can create their own contact cadence`, `policy_auth_fn_not_wrapped:public.contact_cadence.Users can delete their own contact cadence`, `policy_auth_fn_not_wrapped:public.contact_cadence.Users can update their own contact cadence`, `policy_auth_fn_not_wrapped:public.contact_cadence.Users can view their own contact cadence`, `policy_auth_fn_not_wrapped:public.contact_preferences.Users can create their own contact preferences`, `policy_auth_fn_not_wrapped:public.contact_preferences.Users can delete their own contact preferences`, `policy_auth_fn_not_wrapped:public.contact_preferences.Users can update their own contact preferences`, `policy_auth_fn_not_wrapped:public.contact_preferences.Users can view their own contact preferences`, `policy_auth_fn_not_wrapped:public.contact_relatives.Users can delete their own contact_relatives`, `policy_auth_fn_not_wrapped:public.contact_relatives.Users can insert their own contact_relatives`, `policy_auth_fn_not_wrapped:public.contact_relatives.Users can update their own contact_relatives`, `policy_auth_fn_not_wrapped:public.contact_relatives.Users can view their own contact_relatives`, `policy_auth_fn_not_wrapped:public.contact_time_analysis.Users can delete their own contact time analysis`, `policy_auth_fn_not_wrapped:public.contact_time_analysis.Users can insert their own contact time analysis`, `policy_auth_fn_not_wrapped:public.contact_time_analysis.Users can update their own contact time analysis`, `policy_auth_fn_not_wrapped:public.contact_time_analysis.Users can view their own contact time analysis`, `policy_auth_fn_not_wrapped:public.decision_criteria.Users can create their own decision criteria`, `policy_auth_fn_not_wrapped:public.decision_criteria.Users can delete their own decision criteria` … (+129)
- **lints** removido (2): `fk_without_index:public.purchase_history.purchase_history_contact_id_fkey`, `fk_without_index:public.vak_analysis_history.vak_analysis_history_contact_id_fkey`
- **migrations** adicionado (34): `20260110000001_compat_colunas_producao`, `20260110000002_baseline_compat_idempotente`, `20260111000000_garante_colunas_homologacao_suppliers`, `20260111010914_d0b0ab7c-31d9-4a05-99c5-bbd77320bdd8`, `20260111011309_3cf6eaa0-1797-40c2-88e3-ecf1283452bd`, `20260111013310_bda03f4c-4db1-499d-ad48-29fee85f88a0`, `20260111014845_9ce8adb5-376f-4e58-aa9e-da013720eb79`, `20260111021244_1393f33a-ed3d-437a-aef4-63f3d002af52`, `20260111024043_59300762-e425-469a-9e34-35f8ba7ca1e3`, `20260111130846_783060ff-715f-4433-b3e4-1c0ef5409533`, `20260111162422_931d8ea9-50f0-4793-b167-51ddb862bc64`, `20260111164638_38eff8c4-2221-4951-83a6-fd9f3bef0574`, `20260111181309_0d3ec51c-0121-4afe-a635-9223c46d26aa`, `20260111182124_be853165-a33d-4677-93dd-3ea9ebd15b45`, `20260111183305_a7554561-ed71-4a77-a1b5-2ad2436f5356`, `20260111191156_64673555-e916-4e23-8303-a4c31c5fe62a`, `20260111220436_a5d10e89-1bd9-4e98-9367-d7e2dfa44a71`, `20260111230911_1d2d2507-a502-4d61-80f4-bf0d61d668e2`, `20260124175308_b3969198-77f8-4de4-abb9-1ef9475dd1d7`, `20260124180842_985d82f1-0e31-443c-8d84-c7ab79bc4e10`, `20260124184935_7462f0ba-52a4-4ded-a9a4-316446a8223f`, `20260125155610_a5f0704f-a377-42c0-8849-bc49b5254e28`, `20260205224849_9096778e-9234-41f5-be21-6790b6a9e42d`, `20260305204447_d9a65b36-83ab-434e-9699-aac2341f11e1`, `20260309024746_83988e36-095a-4f11-8875-1992bccce2c2`, `20260309024803_b85b4f96-cade-4d3e-a631-06c52da3228c`, `20260314201306_fe0903bc-8d63-4141-86c9-a20941525b3f`, `20260314201812_a721a7a7-e51e-4f7d-8f7a-acb690d68d75`, `20260314203053_cc715c39-87a7-4a90-8de7-ec50b3db3318`, `20260314204440_8523bdc6-d40a-4196-82cc-47fbb891b3ed`, `20260315200326_43c901a9-2094-422f-b504-df2c4f11b3ea`, `20260315221042_ae26604e-9d29-45d8-b4d0-78987fb5fa76`, `20260317185503_da340b8e-9587-4743-9fa9-d56aa3f48f8e`, `20260317190015_ace0c658-b895-46df-a79f-8788fe6c3490`
- **policies (RLS)** adicionado (1): `public.disc_conversion_metrics.Users can manage their own DISC conversion metrics`
- **policies (RLS)** alterado (597): `public.abm_account_plans.abm_plans_insert`, `public.abm_account_plans.abm_plans_select`, `public.abm_account_plans.abm_plans_update`, `public.abm_accounts.abm_accounts_delete`, `public.abm_accounts.abm_accounts_insert`, `public.abm_accounts.abm_accounts_select`, `public.abm_accounts.abm_accounts_update`, `public.abm_buying_committee.abm_committee_delete`, `public.abm_buying_committee.abm_committee_insert`, `public.abm_buying_committee.abm_committee_select`, `public.abm_buying_committee.abm_committee_update`, `public.abm_campaigns.abm_campaigns_delete`, `public.abm_campaigns.abm_campaigns_insert`, `public.abm_campaigns.abm_campaigns_select`, `public.abm_campaigns.abm_campaigns_update`, `public.abm_whitespace_opportunities.abm_whitespace_delete`, `public.abm_whitespace_opportunities.abm_whitespace_insert`, `public.abm_whitespace_opportunities.abm_whitespace_select`, `public.abm_whitespace_opportunities.abm_whitespace_update`, `public.activities.Users can delete their own activities`, `public.activities.Users can insert their own activities`, `public.activities.Users can update their own activities`, `public.activities.Users can view their own activities`, `public.ai_chat_messages.Users manage own messages`, `public.ai_chat_threads.Users manage own threads`, `public.ai_recommendation_audit_logs.Users can insert their own recommendation audit logs`, `public.ai_recommendation_audit_logs.Users can update their own recommendation audit logs`, `public.ai_recommendation_audit_logs.Users can view their own recommendation audit logs`, `public.ai_recommendation_audit_logs_v2.Users can manage their own recommendation logs v2`, `public.ai_recommendation_logs.Users can create their own recommendation logs`, `public.ai_recommendation_logs.Users can update their own recommendation logs`, `public.ai_recommendation_logs.Users can view their own recommendation logs`, `public.ai_tone_preferences.Users can manage their own tone preferences`, `public.alerts.Users can delete their own alerts`, `public.alerts.Users can insert their own alerts`, `public.alerts.Users can update their own alerts`, `public.alerts.Users can view their own alerts`, `public.attribution_models_cache.amc_owner_all`, `public.attribution_touchpoints.atp_owner_all`, `public.automations.automations_delete` … (+557)
- **realtime** adicionado (6): `supabase_realtime:public.alerts`, `supabase_realtime:public.companies`, `supabase_realtime:public.contacts`, `supabase_realtime:public.health_alerts`, `supabase_realtime:public.insights`, `supabase_realtime:public.whatsapp_messages`
- **tabelas** adicionado (1): `public._stg_pac_nums`
- **tabelas** alterado (1): `public.score_history`
- **triggers** removido (17): `public.client_values.update_client_values_updated_at`, `public.companies.update_companies_updated_at`, `public.compatibility_settings.update_compatibility_settings_updated_at`, `public.contact_cadence.update_contact_cadence_updated_at`, `public.contact_preferences.update_contact_preferences_updated_at`, `public.contact_relatives.update_contact_relatives_updated_at`, `public.contacts.update_contacts_updated_at`, `public.decision_criteria.update_decision_criteria_updated_at`, `public.health_alert_settings.update_health_alert_settings_updated_at`, `public.profiles.update_profiles_updated_at`, `public.push_subscriptions.update_push_subscriptions_updated_at`, `public.rfm_analysis.update_rfm_analysis_updated_at`, `public.social_profiles.update_social_profiles_updated_at`, `public.social_scraping_schedule.update_social_scraping_schedule_updated_at`, `public.trigger_ab_tests.update_trigger_ab_tests_updated_at`, `public.trigger_channel_effectiveness.update_trigger_channel_effectiveness_updated_at`, `public.weekly_report_settings.update_weekly_report_settings_updated_at`
- **views** removido (2): `public.vw_suppliers`, `public.vw_suppliers_completo`

## 2026-11-21 15:11 UTC

- **functions** alterado (1): `public.has_role(_user_id uuid, _role app_role)`

## 2026-11-21 14:12 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_17`

## 2026-11-21 12:18 UTC

- **functions** alterado (1): `public.trg_normalizar_email()`
- **migrations** adicionado (1): `20260110000000_baseline_tabelas_base`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_24`

## 2026-11-20 17:11 UTC

- **lints** adicionado (4): `policy_auth_fn_not_wrapped:public.push_subscriptions.Users can create their own subscriptions`, `policy_auth_fn_not_wrapped:public.push_subscriptions.Users can delete their own subscriptions`, `policy_auth_fn_not_wrapped:public.push_subscriptions.Users can update their own subscriptions`, `policy_auth_fn_not_wrapped:public.push_subscriptions.Users can view their own subscriptions`
- **migrations** adicionado (1): `20260109173224_f27798ce-ebf4-4249-9a8f-9514c71cea4a`
- **policies (RLS)** adicionado (1): `public.push_subscriptions.Users can view their own subscriptions`
- **policies (RLS)** alterado (3): `public.push_subscriptions.Users can create their own subscriptions`, `public.push_subscriptions.Users can delete their own subscriptions`, `public.push_subscriptions.Users can update their own subscriptions`

## 2026-11-20 14:14 UTC

- **functions** alterado (2): `public.handle_new_user()`, `public.update_updated_at_column()`
- **indexes** adicionado (4): `public.idx_activities_created_at`, `public.idx_alerts_dismissed`, `public.idx_insights_contact_id`, `public.idx_interactions_contact_id`
- **lints** adicionado (25): `policy_auth_fn_not_wrapped:public.activities.Users can insert their own activities`, `policy_auth_fn_not_wrapped:public.activities.Users can view their own activities`, `policy_auth_fn_not_wrapped:public.alerts.Users can delete their own alerts`, `policy_auth_fn_not_wrapped:public.alerts.Users can insert their own alerts`, `policy_auth_fn_not_wrapped:public.alerts.Users can update their own alerts`, `policy_auth_fn_not_wrapped:public.alerts.Users can view their own alerts`, `policy_auth_fn_not_wrapped:public.companies.Users can delete their own companies`, `policy_auth_fn_not_wrapped:public.companies.Users can insert their own companies`, `policy_auth_fn_not_wrapped:public.companies.Users can update their own companies`, `policy_auth_fn_not_wrapped:public.companies.Users can view their own companies`, `policy_auth_fn_not_wrapped:public.contacts.Users can delete their own contacts`, `policy_auth_fn_not_wrapped:public.contacts.Users can insert their own contacts`, `policy_auth_fn_not_wrapped:public.contacts.Users can update their own contacts`, `policy_auth_fn_not_wrapped:public.contacts.Users can view their own contacts`, `policy_auth_fn_not_wrapped:public.insights.Users can delete their own insights`, `policy_auth_fn_not_wrapped:public.insights.Users can insert their own insights`, `policy_auth_fn_not_wrapped:public.insights.Users can update their own insights`, `policy_auth_fn_not_wrapped:public.insights.Users can view their own insights`, `policy_auth_fn_not_wrapped:public.interactions.Users can delete their own interactions`, `policy_auth_fn_not_wrapped:public.interactions.Users can insert their own interactions`, `policy_auth_fn_not_wrapped:public.interactions.Users can update their own interactions`, `policy_auth_fn_not_wrapped:public.interactions.Users can view their own interactions`, `policy_auth_fn_not_wrapped:public.profiles.Users can insert their own profile`, `policy_auth_fn_not_wrapped:public.profiles.Users can update their own profile`, `policy_auth_fn_not_wrapped:public.profiles.Users can view their own profile`
- **migrations** adicionado (2): `20260109144944_1cfd4579-a713-4b94-89fc-38494c14566f`, `20260109144945_baseline_tabelas_fundadoras`
- **policies (RLS)** adicionado (3): `public.alerts.Users can view their own alerts`, `public.companies.Users can delete their own companies`, `public.companies.Users can insert their own companies`
- **policies (RLS)** alterado (22): `public.activities.Users can insert their own activities`, `public.activities.Users can view their own activities`, `public.alerts.Users can delete their own alerts`, `public.alerts.Users can insert their own alerts`, `public.alerts.Users can update their own alerts`, `public.companies.Users can update their own companies`, `public.companies.Users can view their own companies`, `public.contacts.Users can delete their own contacts`, `public.contacts.Users can insert their own contacts`, `public.contacts.Users can update their own contacts`, `public.contacts.Users can view their own contacts`, `public.insights.Users can delete their own insights`, `public.insights.Users can insert their own insights`, `public.insights.Users can update their own insights`, `public.insights.Users can view their own insights`, `public.interactions.Users can delete their own interactions`, `public.interactions.Users can insert their own interactions`, `public.interactions.Users can update their own interactions`, `public.interactions.Users can view their own interactions`, `public.profiles.Users can insert their own profile`, `public.profiles.Users can update their own profile`, `public.profiles.Users can view their own profile`
- **triggers** adicionado (1): `public.profiles.update_profiles_updated_at`

## 2026-11-20 13:14 UTC

- **colunas** adicionado (7): `public.external_data_audit_log.created_at`, `public.external_data_audit_log.id`, `public.external_data_audit_log.operation`, `public.external_data_audit_log.outcome`, `public.external_data_audit_log.payload`, `public.external_data_audit_log.table_name`, `public.external_data_audit_log.user_id`
- **constraints** adicionado (4): `public.external_data_audit_log.external_data_audit_log_operation_check`, `public.external_data_audit_log.external_data_audit_log_outcome_check`, `public.external_data_audit_log.external_data_audit_log_pkey`, `public.external_data_audit_log.external_data_audit_log_user_id_fkey`
- **grants** adicionado (2): `public.external_data_audit_log:authenticated`, `public.external_data_audit_log:service_role`
- **indexes** adicionado (3): `public.external_data_audit_log_pkey`, `public.idx_external_data_audit_outcome`, `public.idx_external_data_audit_user`
- **lints** adicionado (1): `policy_auth_fn_not_wrapped:public.external_data_audit_log.admin_only_select_external_data_audit`
- **policies (RLS)** adicionado (1): `public.external_data_audit_log.admin_only_select_external_data_audit`
- **tabelas** adicionado (1): `public.external_data_audit_log`

## 2026-11-20 12:18 UTC

- **functions** alterado (1): `public.has_role(_user_id uuid, _role app_role)`

## 2026-11-20 11:13 UTC

- **functions** alterado (168): `public.assert_alert_access(p_alert_id uuid)`, `public.assert_cadence_access(p_cc_id uuid)`, `public.assert_company_access(p_company_id uuid)`, `public.assert_contact_access(p_contact_id uuid)`, `public.assert_customer_access(p_customer_id uuid)`, `public.assert_deal_access(p_deal_id uuid)`, `public.assert_event_access(p_event_id uuid)`, `public.assert_goal_access(p_goal_id uuid)`, `public.assert_interaction_access(p_interaction_id uuid)`, `public.assert_note_access(p_note_id uuid)`, `public.assert_notification_access(p_notification_id uuid)`, `public.assert_opportunity_access(p_opportunity_id uuid)`, `public.assert_proposal_access(p_proposal_id uuid)`, `public.assert_reminder_access(p_reminder_id uuid)`, `public.assert_self_user_id(p_user_id uuid)`, `public.assert_task_access(p_task_id uuid)`, `public.assert_violation_access(p_violation_id uuid)`, `public.assert_visit_access(p_visit_id uuid)`, `public.assign_salesperson(p_company_id uuid, p_vendedor_id integer)`, `public.auto_reset_leads_on_update()`, `public.calculate_lead_score(p_company_id uuid)`, `public.calculate_relationship_score(p_contact_id uuid)`, `public.complete_reminder(p_reminder_id uuid)`, `public.complete_reminder(p_reminder_id uuid, p_create_interaction boolean, p_interaction_notes text)`, `public.coop003_exec(p_data text)`, `public.create_product(p_name text, p_sku text, p_category text, p_unit_price numeric, p_cost_price numeric, p_description text, p_stock_quantity integer)`, `public.create_product(p_sku text, p_name text, p_category text, p_unit_price numeric, p_cost_price numeric, p_description text)`, `public.create_task(p_title text, p_due_date date, p_company_id uuid, p_task_type text, p_priority text, p_description text, p_contact_id uuid, p_deal_id uuid, p_user_id uuid)`, `public.create_webhook(p_name text, p_url text, p_events text[], p_secret text, p_headers jsonb)`, `public.create_webhook(p_name text, p_url text, p_events text[], p_secret text, p_headers jsonb, p_user_id uuid)`, `public.fn_carrier_cron_endpoint()`, `public.fn_carrier_daily_check()`, `public.fn_check_carrier_homologation_expiry()`, `public.fn_check_carrier_score_alerts()`, `public.fn_check_supplier_homologation_expiry()`, `public.fn_check_supplier_score_alerts()`, `public.fn_get_product_ai_context(p_product_id uuid)`, `public.fn_promote_kit_components_batch(p_batch_size integer)`, `public.fn_recalcular_carrier_score(p_carrier_id uuid)`, `public.fn_recalcular_supplier_score(p_supplier_id uuid)` … (+128)

## 2026-11-20 00:33 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_23`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_16`

## 2026-11-19 00:36 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_22`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_15`

## 2026-11-18 19:11 UTC

- **colunas** adicionado (4): `public.incoming_webhook_nonces.created_at`, `public.incoming_webhook_nonces.expires_at`, `public.incoming_webhook_nonces.idempotency_key`, `public.incoming_webhook_nonces.webhook_id`
- **colunas** alterado (1): `public.incoming_webhooks.require_signature`
- **constraints** adicionado (4): `public.incoming_webhook_nonces.incoming_webhook_nonces_idempotency_key_check`, `public.incoming_webhook_nonces.incoming_webhook_nonces_pkey`, `public.incoming_webhook_nonces.incoming_webhook_nonces_webhook_id_fkey`, `public.incoming_webhooks.incoming_webhooks_active_signature_check`
- **functions** adicionado (2): `public.get_activity_overview(p_from timestamp with time zone, p_to timestamp with time zone, p_bucket text)`, `public.guard_contact_relation_write()`
- **functions** alterado (1): `public.has_role(_user_id uuid, _role app_role)`
- **grants** adicionado (1): `public.incoming_webhook_nonces:service_role`
- **indexes** adicionado (2): `public.idx_incoming_webhook_nonces_expires_at`, `public.incoming_webhook_nonces_pkey`
- **migrations** adicionado (7): `20261118181543_incoming_webhook_nonces`, `20261118181554_harden_incoming_webhooks_signature`, `20261118182244_guard_contact_relation_write_fn`, `20261118182317_serialize_contact_relation_write_triggers`, `20261118182619_get_activity_overview`, `20261118182753_get_activity_overview_direcao`, `20261118183212_incoming_webhook_nonces_policy`
- **policies (RLS)** adicionado (1): `public.incoming_webhook_nonces.incoming_webhook_nonces_service_only`
- **tabelas** adicionado (1): `public.incoming_webhook_nonces`
- **triggers** adicionado (4): `public.contact_addresses.serialize_contact_relation_write`, `public.contact_emails.serialize_contact_relation_write`, `public.contact_phones.serialize_contact_relation_write`, `public.contact_social_media.serialize_contact_relation_write`

## 2026-11-18 16:14 UTC

- **realtime** removido (4): `supabase_realtime_messages_publication:realtime.messages_2026_11_11`, `supabase_realtime_messages_publication:realtime.messages_2026_11_12`, `supabase_realtime_messages_publication:realtime.messages_2026_11_13`, `supabase_realtime_messages_publication:realtime.messages_2026_11_14`

## 2026-11-18 15:13 UTC

- **constraints** alterado (6): `public.companies.chk_companies_no_self_reference`, `public.csat_surveys.csat_surveys_answered_score_check`, `public.entity_relationships.entity_relationships_no_self`, `public.entity_relationships.entity_relationships_period_valid`, `zapp_history.conversation_daily_summaries.chk_cds_period_order`, `zapp_history.messages.chk_content_or_media`
- **lints** removido (16): `view_security_definer:public.v_company_summary`, `view_security_definer:public.v_entities`, `view_security_definer:public.vw_alertas_pendentes_vendedor`, `view_security_definer:public.vw_carrier_homologation_queue`, `view_security_definer:public.vw_carriers`, `view_security_definer:public.vw_carriers_completo`, `view_security_definer:public.vw_cliente_completo`, `view_security_definer:public.vw_clientes_prioridade`, `view_security_definer:public.vw_companies_completo`, `view_security_definer:public.vw_company_addresses`, `view_security_definer:public.vw_contacts_sem_apelido`, `view_security_definer:public.vw_customers`, `view_security_definer:public.vw_supplier_homologation_queue`, `view_security_definer:public.vw_suppliers`, `view_security_definer:public.vw_suppliers_completo`, `view_security_definer:public.vw_top_clientes_vendedor`
- **migrations** adicionado (1): `20261118150043_views_security_invoker_16`
- **views** alterado (16): `public.v_company_summary`, `public.v_entities`, `public.vw_alertas_pendentes_vendedor`, `public.vw_carrier_homologation_queue`, `public.vw_carriers`, `public.vw_carriers_completo`, `public.vw_cliente_completo`, `public.vw_clientes_prioridade`, `public.vw_companies_completo`, `public.vw_company_addresses`, `public.vw_contacts_sem_apelido`, `public.vw_customers`, `public.vw_supplier_homologation_queue`, `public.vw_suppliers`, `public.vw_suppliers_completo`, `public.vw_top_clientes_vendedor`

## 2026-11-18 13:13 UTC

- **functions** removido (1): `public.__diag_multiplix()`
- **functions** alterado (1): `public.multiplix_list_ufs()`
- **realtime** adicionado (4): `supabase_realtime_messages_publication:realtime.messages_2026_11_18`, `supabase_realtime_messages_publication:realtime.messages_2026_11_19`, `supabase_realtime_messages_publication:realtime.messages_2026_11_20`, `supabase_realtime_messages_publication:realtime.messages_2026_11_21`

## 2026-11-18 12:36 UTC

- **functions** adicionado (1): `public.__diag_multiplix()`
- **functions** alterado (1): `public.multiplix_list_ufs()`
- **indexes** removido (17): `public.idx_churn_risk_scores_user_id`, `public.idx_client_val_contact`, `public.idx_dec_crit_contact`, `public.idx_disc_analysis_contact`, `public.idx_disc_analysis_history_user_id`, `public.idx_disc_comm_contact`, `public.idx_document_signatures_user_id`, `public.idx_emo_anchors_contact`, `public.idx_emo_states_contact`, `public.idx_neuro_history_contact`, `public.idx_objections_contact`, `public.idx_offer_sug_contact`, `public.idx_whatsapp_messages_company`, `public.idx_whatsapp_messages_contact`, `public.legacy_sales_activities_sale_scope_idx`, `public.legacy_sales_activities_salesperson_scope_idx`, `public.legacy_sales_salesperson_scope_idx`
- **migrations** adicionado (2): `20261118121105_remove_duplicate_indexes`, `20261118122016_multiplix_list_ufs_cast_text`

## 2026-11-14 01:13 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_17`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_10`

## 2026-11-13 21:45 UTC

- **functions** alterado (1): `public.check_mtta_auto_ack_heartbeat()`

## 2026-11-13 00:50 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_16`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_09`

## 2026-11-12 02:34 UTC

- **cron jobs** alterado (1): `2457:singu-edge-weekly-digest`
- **functions** alterado (4): `public.auto_ack_stale_mtta_sla_breaches()`, `public.check_contact_health_alerts()`, `public.check_mtta_auto_ack_heartbeat()`, `public.cleanup_simulated_alerts()`
- **migrations** adicionado (1): `20261112001000_weekly_digest_cron_horario`

## 2026-11-12 01:49 UTC

- **cron jobs** adicionado (19): `2444:singu-edge-validation-queue-worker`, `2445:singu-edge-process-webhook-dlq`, `2446:singu-edge-sequence-processor`, `2447:singu-edge-nurturing-runner`, `2448:singu-edge-check-notifications`, `2449:singu-edge-check-health-alerts`, `2450:singu-edge-mql-evaluator`, `2451:singu-edge-revops-snapshot-builder`, `2452:singu-edge-lead-score-cron`, `2453:singu-edge-cs-health-recalc`, `2454:singu-edge-forecast-snapshot-cron`, `2455:singu-edge-client-notifications`, `2456:singu-edge-template-success-notifications`, `2457:singu-edge-weekly-digest`, `2458:check-contact-health-daily`, `2459:mtta-sla-breach-auto-ack-hourly`, `2460:mtta-auto-ack-heartbeat-watchdog`, `2461:cleanup-simulated-alerts-weekly`, `2462:revalidate-stale-emails`
- **functions** adicionado (1): `public.increment_workflow_completed(_id uuid)`
- **functions** alterado (4): `public.auto_ack_stale_mtta_sla_breaches()`, `public.check_contact_health_alerts()`, `public.check_mtta_auto_ack_heartbeat()`, `public.cleanup_simulated_alerts()`
- **migrations** adicionado (2): `20261111210500_agenda_edge_functions_cron`, `20261111233000_reagenda_rotinas_sql_e_rpc_nurturing`
- **vault secrets (nomes)** adicionado (1): `singu_cron_secret`

## 2026-11-12 00:58 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_15`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_08`

## 2026-11-11 13:55 UTC

- **cron jobs** adicionado (1): `858:cleanup_cron_job_run_details_daily`
- **functions** adicionado (1): `public.cleanup_cron_job_run_details(_dias integer)`

## 2026-11-11 01:16 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_14`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_07`

## 2026-11-10 22:14 UTC

- **functions** removido (1): `public.update_company_fields(p_company_id uuid, p_data jsonb)`

## 2026-11-10 19:59 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_06`

## 2026-11-10 18:49 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_13`

## 2026-11-10 01:05 UTC

- **functions** alterado (4): `public.fn_cf_collect_sm_legacy_dispatch(p_start_page integer, p_end_page integer)`, `public.get_unified_communication_history(p_company_id uuid, p_limit integer)`, `public.has_role(_user_id uuid, _role app_role)`, `public.immutable_unaccent(text)`
- **migrations** alterado (1): `20260607211026_fn_cf_collect_sm_legacy_v2_async`

## 2026-11-09 04:22 UTC

- **functions** alterado (1): `public.merge_records_atomically(p_entity text, p_primary_id uuid, p_secondary_id uuid, p_field_overrides jsonb)`
- **migrations** adicionado (1): `20261109010329_fix_merge_nome_crm_override`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_12`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_05`

## 2026-11-08 21:48 UTC

- **functions** alterado (3): `public.get_birthday_contacts(p_days_ahead integer)`, `public.get_duplicate_contacts(p_limit integer)`, `public.set_updated_at()`

## 2026-11-08 20:48 UTC

- **functions** alterado (1): `public.set_updated_at()`
- **indexes** adicionado (2): `public.idx_contact_emails_primary`, `public.idx_contact_phones_primary`
- **migrations** adicionado (1): `20261108203932_fix_contact_phones_trigger_primary_indexes`
- **triggers** removido (1): `public.contact_phones.set_updated_at`

## 2026-11-08 19:57 UTC

- **functions** alterado (1): `public.merge_records_atomically(p_entity text, p_primary_id uuid, p_secondary_id uuid, p_field_overrides jsonb)`

## 2026-11-08 18:49 UTC

- **functions** alterado (1): `public.cleanup_rpc_perf_samples()`

## 2026-11-08 17:36 UTC

- **grants** adicionado (1899): `_dormant.access_denied_logs:anon`, `_dormant.access_denied_logs:authenticated`, `_dormant.access_denied_logs:service_role`, `_dormant.active_power_ups:anon`, `_dormant.active_power_ups:authenticated`, `_dormant.active_power_ups:service_role`, `_dormant.active_sessions:anon`, `_dormant.active_sessions:authenticated`, `_dormant.active_sessions:service_role`, `_dormant.activity_goals:anon`, `_dormant.activity_goals:authenticated`, `_dormant.activity_goals:service_role`, `_dormant.activity_log:anon`, `_dormant.activity_log:authenticated`, `_dormant.activity_log:service_role`, `_dormant.alert_log:anon`, `_dormant.alert_log:authenticated`, `_dormant.alert_log:service_role`, `_dormant.alertas_inativacao:anon`, `_dormant.alertas_inativacao:authenticated`, `_dormant.alertas_inativacao:service_role`, `_dormant.api_usage_log:anon`, `_dormant.api_usage_log:authenticated`, `_dormant.api_usage_log:service_role`, `_dormant.automation_logs:anon`, `_dormant.automation_logs:authenticated`, `_dormant.automation_logs:service_role`, `_dormant.automation_rules:anon`, `_dormant.automation_rules:authenticated`, `_dormant.automation_rules:service_role`, `_dormant.available_spins:anon`, `_dormant.available_spins:authenticated`, `_dormant.available_spins:service_role`, `_dormant.battle_participants:anon`, `_dormant.battle_participants:authenticated`, `_dormant.battle_participants:service_role`, `_dormant.bitrix24_sync_logs:anon`, `_dormant.bitrix24_sync_logs:authenticated`, `_dormant.bitrix24_sync_logs:service_role`, `_dormant.blocked_ips:anon` … (+1859)

## 2026-11-08 15:48 UTC

- Snapshot inicial.

