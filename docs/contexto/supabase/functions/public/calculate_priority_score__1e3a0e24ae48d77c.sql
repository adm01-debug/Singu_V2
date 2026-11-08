CREATE OR REPLACE FUNCTION public.calculate_priority_score(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score numeric := 50;
  v_factors jsonb := '{}'::jsonb;
  v_days_inactive int;
  v_pending_followup boolean;
  v_last_sentiment text;
  v_interaction_count int;
  v_is_vip boolean;
BEGIN
  -- Dias sem contato
  SELECT EXTRACT(DAY FROM NOW() - MAX(data_interacao))::int INTO v_days_inactive
  FROM interactions WHERE company_id = p_company_id;
  
  -- Follow-up pendente
  SELECT EXISTS(
    SELECT 1 FROM interactions 
    WHERE company_id = p_company_id 
      AND COALESCE(follow_up_date, data_followup::date) <= CURRENT_DATE
      AND COALESCE(followup_concluido, false) = false
  ) INTO v_pending_followup;
  
  -- Último sentimento
  SELECT sentiment INTO v_last_sentiment
  FROM interactions WHERE company_id = p_company_id ORDER BY created_at DESC LIMIT 1;
  
  -- Total de interações
  SELECT COUNT(*) INTO v_interaction_count FROM interactions WHERE company_id = p_company_id;
  
  -- É VIP?
  SELECT 'vip' = ANY(COALESCE(tags_array, ARRAY[]::text[])) INTO v_is_vip
  FROM companies WHERE id = p_company_id;
  
  -- Cálculo
  IF v_days_inactive IS NOT NULL THEN
    IF v_days_inactive > 30 THEN v_score := v_score + 20; END IF;
    IF v_days_inactive > 60 THEN v_score := v_score + 10; END IF;
  END IF;
  
  IF v_pending_followup THEN v_score := v_score + 15; END IF;
  IF v_last_sentiment = 'negative' THEN v_score := v_score + 10; END IF;
  IF v_is_vip THEN v_score := v_score + 10; END IF;
  IF v_interaction_count = 0 THEN v_score := v_score - 20; END IF;
  
  v_factors := jsonb_build_object(
    'days_inactive', COALESCE(v_days_inactive, 0),
    'pending_followup', COALESCE(v_pending_followup, false),
    'last_sentiment', v_last_sentiment,
    'interaction_count', v_interaction_count,
    'is_vip', COALESCE(v_is_vip, false)
  );
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'priority_score', LEAST(100, GREATEST(0, ROUND(v_score))),
    'priority_level', CASE 
      WHEN v_score >= 80 THEN 'critical'
      WHEN v_score >= 60 THEN 'high'
      WHEN v_score >= 40 THEN 'medium'
      ELSE 'low'
    END,
    'factors', v_factors,
    'calculated_at', NOW()
  );
END;
$function$
