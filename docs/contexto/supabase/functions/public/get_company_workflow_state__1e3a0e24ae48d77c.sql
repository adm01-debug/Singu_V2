CREATE OR REPLACE FUNCTION public.get_company_workflow_state(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company record;
  v_last_interaction record;
  v_state text;
  v_next_action text;
BEGIN
  SELECT * INTO v_company FROM companies WHERE id = p_company_id;
  
  SELECT * INTO v_last_interaction 
  FROM interactions 
  WHERE company_id = p_company_id 
  ORDER BY data_interacao DESC 
  LIMIT 1;
  
  -- Determina estado do workflow
  IF v_company.status = 'inativo' THEN
    v_state := 'inactive';
    v_next_action := 'Reativar relacionamento';
  ELSIF v_last_interaction IS NULL THEN
    v_state := 'new_lead';
    v_next_action := 'Fazer primeiro contato';
  ELSIF v_last_interaction.data_interacao < NOW() - interval '30 days' THEN
    v_state := 'dormant';
    v_next_action := 'Reengajar cliente';
  ELSIF v_last_interaction.sentiment = 'negative' THEN
    v_state := 'at_risk';
    v_next_action := 'Recuperar relacionamento';
  ELSIF v_last_interaction.follow_up_date IS NOT NULL AND v_last_interaction.follow_up_date <= CURRENT_DATE THEN
    v_state := 'pending_followup';
    v_next_action := 'Realizar followup agendado';
  ELSE
    v_state := 'active';
    v_next_action := 'Manter engajamento';
  END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'company_name', COALESCE(v_company.nome_fantasia, v_company.nome_crm, v_company.razao_social),
    'current_state', v_state,
    'suggested_action', v_next_action,
    'last_interaction', v_last_interaction.data_interacao,
    'last_sentiment', v_last_interaction.sentiment,
    'days_since_contact', EXTRACT(DAY FROM NOW() - COALESCE(v_last_interaction.data_interacao, v_company.created_at))::int
  );
END;
$function$
