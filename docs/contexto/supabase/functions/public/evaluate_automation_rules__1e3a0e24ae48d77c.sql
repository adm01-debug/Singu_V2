CREATE OR REPLACE FUNCTION public.evaluate_automation_rules(p_company_id uuid)
 RETURNS TABLE(rule_name text, condition_met boolean, action_suggested text, priority integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days_inactive INT;
  v_sentiment TEXT;
  v_followups_pending INT;
  v_last_contact TIMESTAMPTZ;
BEGIN
  -- Coletar dados da empresa
  SELECT 
    (CURRENT_DATE - MAX(created_at)::DATE),
    (SELECT sentiment FROM interactions WHERE company_id = p_company_id ORDER BY created_at DESC LIMIT 1),
    COUNT(*) FILTER (WHERE follow_up_required AND NOT COALESCE(followup_concluido, FALSE))
  INTO v_days_inactive, v_sentiment, v_followups_pending
  FROM interactions
  WHERE company_id = p_company_id;

  -- Regra 1: Cliente inativo
  RETURN QUERY SELECT 
    'cliente_inativo'::TEXT,
    v_days_inactive > 30,
    'Agendar ligação de reativação'::TEXT,
    1;

  -- Regra 2: Sentimento negativo
  RETURN QUERY SELECT 
    'sentimento_negativo'::TEXT,
    v_sentiment = 'negativo',
    'Escalar para gerente'::TEXT,
    2;

  -- Regra 3: Followups acumulados
  RETURN QUERY SELECT 
    'followups_acumulados'::TEXT,
    v_followups_pending >= 3,
    'Priorizar resolução de pendências'::TEXT,
    3;

  -- Regra 4: Sem contato há 60+ dias
  RETURN QUERY SELECT 
    'risco_churn'::TEXT,
    v_days_inactive > 60,
    'Ação de recuperação urgente'::TEXT,
    1;
    
  RETURN;
END;
$function$
