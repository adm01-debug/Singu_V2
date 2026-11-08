CREATE OR REPLACE FUNCTION public.get_company_health_score(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score int := 0;
  v_max_score int := 100;
  v_interaction_count int;
  v_days_since_last int;
  v_has_contact boolean;
  v_has_deal boolean;
  v_factors jsonb := '[]'::jsonb;
BEGIN
  -- Contar interações
  SELECT COUNT(*) INTO v_interaction_count FROM interactions WHERE company_id = p_company_id;
  IF v_interaction_count >= 10 THEN v_score := v_score + 25; v_factors := v_factors || '{"factor": "interacoes_altas", "points": 25}'::jsonb;
  ELSIF v_interaction_count >= 5 THEN v_score := v_score + 15; v_factors := v_factors || '{"factor": "interacoes_medias", "points": 15}'::jsonb;
  ELSIF v_interaction_count >= 1 THEN v_score := v_score + 5; v_factors := v_factors || '{"factor": "interacoes_baixas", "points": 5}'::jsonb;
  END IF;
  
  -- Recência
  SELECT EXTRACT(DAY FROM NOW() - MAX(data_interacao))::int INTO v_days_since_last FROM interactions WHERE company_id = p_company_id;
  IF v_days_since_last IS NOT NULL AND v_days_since_last <= 7 THEN v_score := v_score + 25; v_factors := v_factors || '{"factor": "recencia_alta", "points": 25}'::jsonb;
  ELSIF v_days_since_last IS NOT NULL AND v_days_since_last <= 30 THEN v_score := v_score + 15; v_factors := v_factors || '{"factor": "recencia_media", "points": 15}'::jsonb;
  END IF;
  
  -- Contato
  SELECT EXISTS (SELECT 1 FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL) INTO v_has_contact;
  IF v_has_contact THEN v_score := v_score + 25; v_factors := v_factors || '{"factor": "tem_contato", "points": 25}'::jsonb; END IF;
  
  -- Deal
  SELECT EXISTS (SELECT 1 FROM deals WHERE company_id = p_company_id) INTO v_has_deal;
  IF v_has_deal THEN v_score := v_score + 25; v_factors := v_factors || '{"factor": "tem_deal", "points": 25}'::jsonb; END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'health_score', v_score,
    'max_score', v_max_score,
    'percentage', ROUND(v_score * 100.0 / v_max_score, 1),
    'factors', v_factors
  );
END;
$function$
