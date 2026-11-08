CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0; v_last_int timestamptz; v_int_count int; v_deal_count int;
BEGIN
  SELECT MAX(data_interacao), COUNT(*) INTO v_last_int, v_int_count FROM interactions WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_deal_count FROM deals WHERE company_id = p_company_id;
  
  -- Recência (+40 max)
  IF v_last_int >= NOW() - interval '7 days' THEN v_score := v_score + 40;
  ELSIF v_last_int >= NOW() - interval '30 days' THEN v_score := v_score + 25;
  ELSIF v_last_int >= NOW() - interval '90 days' THEN v_score := v_score + 10;
  END IF;
  
  -- Frequência (+30 max)
  IF v_int_count >= 20 THEN v_score := v_score + 30;
  ELSIF v_int_count >= 10 THEN v_score := v_score + 20;
  ELSIF v_int_count >= 5 THEN v_score := v_score + 10;
  END IF;
  
  -- Deals (+30 max)
  IF v_deal_count >= 3 THEN v_score := v_score + 30;
  ELSIF v_deal_count >= 1 THEN v_score := v_score + 15;
  END IF;
  
  RETURN v_score;
END;
$function$
