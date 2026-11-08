CREATE OR REPLACE FUNCTION public.calculate_propensity_score(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0; v_similar_conversions numeric; v_int_trend int; v_deal_hist int;
BEGIN
  -- Histórico de compras do segmento
  SELECT ROUND(COUNT(*) FILTER (WHERE c2.is_customer = true)::numeric / NULLIF(COUNT(*), 0) * 30, 0)::int INTO v_score
  FROM companies c JOIN companies c2 ON c2.ramo_atividade = c.ramo_atividade WHERE c.id = p_company_id AND c2.deleted_at IS NULL;
  
  -- Tendência de interações (crescente = +20)
  SELECT CASE WHEN COUNT(*) FILTER (WHERE data_interacao >= NOW() - interval '15 days') > COUNT(*) FILTER (WHERE data_interacao < NOW() - interval '15 days' AND data_interacao >= NOW() - interval '30 days') THEN 20 ELSE 0 END
  INTO v_int_trend FROM interactions WHERE company_id = p_company_id AND data_interacao >= NOW() - interval '30 days';
  v_score := v_score + v_int_trend;
  
  -- Deal aberto (+30)
  IF EXISTS (SELECT 1 FROM deals WHERE company_id = p_company_id AND status NOT IN ('ganho', 'perdido')) THEN v_score := v_score + 30; END IF;
  
  -- Contato decisor (+20)
  IF EXISTS (SELECT 1 FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL AND (cargo ILIKE '%diretor%' OR cargo ILIKE '%gerente%' OR cargo ILIKE '%CEO%' OR cargo ILIKE '%dono%')) THEN v_score := v_score + 20; END IF;
  
  RETURN LEAST(v_score, 100);
END;
$function$
