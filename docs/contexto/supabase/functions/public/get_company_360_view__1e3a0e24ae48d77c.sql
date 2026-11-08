CREATE OR REPLACE FUNCTION public.get_company_360_view(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- campos no topo para o contrato Company360 do frontend (useCompany360)
  RETURN jsonb_build_object(
    'id', p_company_id,
    'name', (SELECT COALESCE(nome_crm, nome_fantasia, razao_social) FROM companies WHERE id = p_company_id),
    'cnpj', (SELECT cnpj FROM companies WHERE id = p_company_id),
    'industry', (SELECT ramo_atividade FROM companies WHERE id = p_company_id),
    'health_score', (
      SELECT COALESCE((h->>'health_score')::numeric, (h->>'score')::numeric, (h->>'overall_score')::numeric)
      FROM (SELECT get_company_health_score(p_company_id) h) s
    ),
    'total_contacts', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id),
    'top_contacts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ct.id, 'name', ct.full_name, 'role', ct.cargo, 'score', ct.relationship_score)), '[]'::jsonb)
      FROM (SELECT * FROM contacts WHERE company_id = p_company_id ORDER BY relationship_score DESC NULLS LAST LIMIT 5) ct
    ),
    'recent_activities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', i.type, 'date', i.data_interacao, 'description', COALESCE(i.resumo, i.content))), '[]'::jsonb)
      FROM (SELECT * FROM interactions WHERE company_id = p_company_id ORDER BY data_interacao DESC LIMIT 10) i
    ),
    'company', (SELECT to_jsonb(c) - 'deleted_at' FROM companies c WHERE id = p_company_id),
    'contacts', (SELECT COALESCE(jsonb_agg(to_jsonb(ct) ORDER BY ct.created_at), '[]'::jsonb) FROM contacts ct WHERE company_id = p_company_id),
    'addresses', (SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb) FROM company_addresses a WHERE company_id = p_company_id),
    'recent_interactions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', i.id, 'date', i.data_interacao, 'type', i.type,
        'notes', COALESCE(i.resumo, i.content), 'sentiment', i.sentiment
      ) ORDER BY i.data_interacao DESC), '[]'::jsonb)
      FROM (SELECT * FROM interactions WHERE company_id = p_company_id ORDER BY data_interacao DESC LIMIT 10) i
    ),
    'stats', jsonb_build_object(
      'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
      'total_contacts', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id),
      'days_as_client', EXTRACT(DAY FROM NOW() - (SELECT created_at FROM companies WHERE id = p_company_id))::int,
      'last_contact', (SELECT MAX(data_interacao) FROM interactions WHERE company_id = p_company_id)
    ),
    'scores', jsonb_build_object(
      'engagement', calculate_engagement_score(p_company_id),
      'priority', calculate_priority_score(p_company_id),
      'health', get_company_health_score(p_company_id)
    ),
    'key_metrics', jsonb_build_object(
      'stats', jsonb_build_object(
        'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
        'total_contacts', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id),
        'days_as_client', EXTRACT(DAY FROM NOW() - (SELECT created_at FROM companies WHERE id = p_company_id))::int,
        'last_contact', (SELECT MAX(data_interacao) FROM interactions WHERE company_id = p_company_id)
      )
    ),
    'workflow', get_company_workflow_state(p_company_id),
    'generated_at', NOW()
  );
END;
$function$
