-- Etapa 13 (plano banco-único): fecha o gap remanescente do t202/t203.
-- 77 trigger functions ainda tinham EXECUTE para anon/public (retorno trigger nunca é exposto via PostgREST RPC — zero impacto funcional, redução pura de superfície).
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'singu_interactions_compat_sync()','singu_sales_team_members_compat()','singu_sync_contact_email()',
    'singu_sync_contact_phone()','singu_reverse_sync_contact()','auto_reset_leads_on_update()',
    'singu_contacts_normalize_checks()','singu_sync_company_address()','singu_reverse_sync_company_address()',
    'generate_quote_number()','singu_companies_compat_sync()','trg_fn_sync_company_carrier()',
    'trg_pix_accounts_updated_at()','trigger_update_deal_on_proposal()','trigger_create_deal_on_qualification()',
    'trg_fn_carrier_recalc_score_after_evaluation()','trg_fn_carrier_update_homologado_flag()',
    'trg_fn_prevent_carrier_evaluation_update()','trg_fn_protect_carrier_qualification_config()',
    'calcular_valor_produto()','trg_fn_update_homologado_flag()','trg_video_queue_updated_at()',
    'fn_update_contact_notes_updated_at()','update_contact_search_vector()','update_nlp_updated_at_column()',
    'auto_update_relationship_stage()','auto_atualizar_nomes_contato()','auto_preencher_nomes_contato()',
    'check_apelido_on_interaction()','gerar_codigo_lead()','trg_fn_recalc_score_after_evaluation()',
    'update_uapi_sessions_updated_at()','trg_fn_sync_company_supplier()','registrar_lead_history()',
    'staging_wpp_updated_at()','sync_contact_fields_dynamic()','trg_fn_protect_qualification_config()',
    'trigger_notify_deal_changes()','trg_fn_prevent_evaluation_update()','trg_normalizar_telefone()',
    'trg_normalizar_telefone_contact()','trigger_update_score_on_interaction()','update_profiles_updated_at()',
    'gerar_codigo_deal()','set_created_at()','update_updated_at()','update_company_search_vector()',
    'update_workspace_accounts_updated_at()','calcular_valor_deal()','update_coop_updated_at()',
    'normalize_contact_phone()','normalize_email()','normalize_email_trigger()','normalize_phone_trigger()',
    'registrar_deal_history()','sync_company_type_flags()','sync_interaction_fields()','trg_normalizar_email()',
    'trigger_log_deal_activity()','trigger_log_interaction_activity()','track_changes()',
    'fn_trigger_sync_product_status_fields()','handle_recurring_life_event()','handle_updated_at()',
    'calculate_relationship_metrics()','check_mbti_consistency()','enqueue_crm_reprocess()',
    'fn_validate_deal_stage_transition()','increment_contact_version()','log_contact_relationship_changes()',
    'set_user_ui_preferences_updated_at()','tg_set_updated_at()','touch_system_config()',
    'update_bpr_queue_updated_at()','update_contact_relationship_metrics()','update_updated_at_column()',
    'validate_entity_relationship()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    IF to_regprocedure('public.' || fn) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, authenticated, public', fn);
    END IF;
  END LOOP;
END $$;
