CREATE OR REPLACE FUNCTION public.calculate_company_health_score(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0; v_last_int interval; v_int_count int; v_deals_won int; v_revenue numeric;
BEGIN
  SELECT NOW() - MAX(data_interacao), COUNT(*) INTO v_last_int, v_int_count FROM interactions WHERE company_id = p_company_id;
  SELECT COUNT(*), COALESCE(SUM(valor), 0) INTO v_deals_won, v_revenue FROM deals WHERE company_id = p_company_id AND status = 'ganho';
  
  -- Recência (+25)
  IF v_last_int < interval '7 days' THEN v_score := 25;
  ELSIF v_last_int < interval '30 days' THEN v_score := 15;
  ELSIF v_last_int < interval '60 days' THEN v_score := 5; END IF;
  
  -- Frequência (+25)
  IF v_int_count >= 20 THEN v_score := v_score + 25;
  ELSIF v_int_count >= 10 THEN v_score := v_score + 15;
  ELSIF v_int_count >= 5 THEN v_score := v_score + 10; END IF;
  
  -- Monetary (+25)
  IF v_revenue >= 50000 THEN v_score := v_score + 25;
  ELSIF v_revenue >= 20000 THEN v_score := v_score + 15;
  ELSIF v_revenue >= 5000 THEN v_score := v_score + 10;
  ELSIF v_revenue > 0 THEN v_score := v_score + 5; END IF;
  
  -- Deals (+25)
  IF v_deals_won >= 5 THEN v_score := v_score + 25;
  ELSIF v_deals_won >= 3 THEN v_score := v_score + 15;
  ELSIF v_deals_won >= 1 THEN v_score := v_score + 10; END IF;
  
  RETURN v_score;
END;
$function$
