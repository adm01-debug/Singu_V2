CREATE OR REPLACE FUNCTION public.get_account_plan(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'company_name', (SELECT COALESCE(nome_fantasia, nome_crm) FROM companies WHERE id = p_company_id),
    'health_score', calculate_company_health_score(p_company_id),
    'lifetime_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE company_id = p_company_id AND status = 'ganho'),
    'open_opportunities', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE company_id = p_company_id AND status NOT IN ('ganho', 'perdido')),
    'key_contacts', (SELECT jsonb_agg(jsonb_build_object('name', COALESCE(full_name, first_name), 'cargo', cargo, 'importance', calculate_contact_importance(id))) FROM (SELECT * FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL ORDER BY calculate_contact_importance(id) DESC LIMIT 5) sub),
    'recent_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id AND data_interacao >= NOW() - interval '30 days'),
    'next_action', get_next_best_action(p_company_id),
    'churn_risk', calculate_churn_risk(p_company_id),
    'upsell_potential', (SELECT calculate_propensity_score(p_company_id))
  );
END;
$function$
