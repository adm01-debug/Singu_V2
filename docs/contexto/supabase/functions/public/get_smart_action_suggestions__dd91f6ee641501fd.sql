CREATE OR REPLACE FUNCTION public.get_smart_action_suggestions(p_user_id uuid DEFAULT auth.uid(), p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_suggestions jsonb := '[]'::jsonb;
  v_company record;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Sugestão 1: Empresas que precisam de followup urgente
  FOR v_company IN
    SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name, i.follow_up_date
    FROM companies c
    JOIN interactions i ON i.company_id = c.id
    WHERE c.user_id = p_user_id
      AND i.follow_up_date <= CURRENT_DATE
      AND i.follow_up_date IS NOT NULL
    ORDER BY i.follow_up_date
    LIMIT 3
  LOOP
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'urgent_followup',
      'priority', 'high',
      'company_id', v_company.id,
      'company_name', v_company.company_name,
      'action', 'Realizar followup agendado',
      'due_date', v_company.follow_up_date
    );
  END LOOP;
  
  -- Sugestão 2: Empresas com muitas interações recentes (oportunidade quente)
  FOR v_company IN
    SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name, COUNT(i.id) as int_count
    FROM companies c
    JOIN interactions i ON i.company_id = c.id AND i.created_at >= NOW() - interval '7 days'
    WHERE c.user_id = p_user_id AND c.status = 'ativo'
    GROUP BY c.id, c.nome_fantasia, c.nome_crm, c.razao_social
    HAVING COUNT(i.id) >= 3
    ORDER BY COUNT(i.id) DESC
    LIMIT 3
  LOOP
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'hot_opportunity',
      'priority', 'medium',
      'company_id', v_company.id,
      'company_name', v_company.company_name,
      'action', 'Cliente engajado - oportunidade de conversão',
      'interactions_7d', v_company.int_count
    );
  END LOOP;
  
  -- Sugestão 3: Empresas abandonadas (sem contato há muito tempo)
  FOR v_company IN
    SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name, MAX(i.data_interacao)::date as last_contact
    FROM companies c
    LEFT JOIN interactions i ON i.company_id = c.id
    WHERE c.user_id = p_user_id AND c.status = 'ativo'
    GROUP BY c.id, c.nome_fantasia, c.nome_crm, c.razao_social
    HAVING MAX(i.data_interacao) < NOW() - interval '30 days' OR MAX(i.data_interacao) IS NULL
    ORDER BY MAX(i.data_interacao) NULLS FIRST
    LIMIT 3
  LOOP
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'reactivation',
      'priority', 'low',
      'company_id', v_company.id,
      'company_name', v_company.company_name,
      'action', 'Reativar contato - empresa sem interação',
      'last_contact', v_company.last_contact
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'suggestions', v_suggestions,
    'total', jsonb_array_length(v_suggestions),
    'generated_at', NOW()
  );
END;
$function$
