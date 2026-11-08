CREATE OR REPLACE FUNCTION public.get_rfm_recommendations(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rfm company_rfm_scores%ROWTYPE;
  v_recommendations text[] := '{}';
BEGIN
  SELECT * INTO v_rfm FROM company_rfm_scores WHERE company_id = p_company_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'RFM não calculado'); END IF;
  
  IF v_rfm.recency_score <= 2 THEN
    v_recommendations := array_append(v_recommendations, 'Empresa inativa há muito tempo - iniciar campanha de reativação');
  END IF;
  IF v_rfm.frequency_score <= 2 THEN
    v_recommendations := array_append(v_recommendations, 'Baixa frequência de compra - oferecer programa de fidelidade');
  END IF;
  IF v_rfm.monetary_score <= 2 THEN
    v_recommendations := array_append(v_recommendations, 'Baixo ticket médio - apresentar produtos de maior valor');
  END IF;
  IF v_rfm.combined_score >= 4 THEN
    v_recommendations := array_append(v_recommendations, 'Cliente top - manter relacionamento próximo e exclusivo');
  END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'rfm_score', v_rfm.combined_score,
    'recommendations', v_recommendations
  );
END;
$function$
