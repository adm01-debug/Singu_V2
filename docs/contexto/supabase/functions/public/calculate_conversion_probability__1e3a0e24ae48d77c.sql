CREATE OR REPLACE FUNCTION public.calculate_conversion_probability(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0; v_int_count int; v_last_int interval; v_has_deal boolean;
BEGIN
  SELECT COUNT(*), NOW() - MAX(data_interacao) INTO v_int_count, v_last_int FROM interactions WHERE company_id = p_company_id;
  SELECT EXISTS(SELECT 1 FROM deals WHERE company_id = p_company_id AND status NOT IN ('ganho', 'perdido')) INTO v_has_deal;
  
  -- Interações recentes (+30)
  IF v_last_int < interval '7 days' THEN v_score := v_score + 30;
  ELSIF v_last_int < interval '30 days' THEN v_score := v_score + 15; END IF;
  
  -- Volume de interações (+25)
  IF v_int_count >= 10 THEN v_score := v_score + 25;
  ELSIF v_int_count >= 5 THEN v_score := v_score + 15;
  ELSIF v_int_count >= 2 THEN v_score := v_score + 5; END IF;
  
  -- Deal aberto (+30)
  IF v_has_deal THEN v_score := v_score + 30; END IF;
  
  -- CNPJ válido (+15)
  IF EXISTS (SELECT 1 FROM companies WHERE id = p_company_id AND cnpj IS NOT NULL AND LENGTH(cnpj) >= 11) THEN v_score := v_score + 15; END IF;
  
  RETURN v_score;
END;
$function$
