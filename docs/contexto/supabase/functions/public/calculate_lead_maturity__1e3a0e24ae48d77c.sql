CREATE OR REPLACE FUNCTION public.calculate_lead_maturity(p_company_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0; v_int_count int; v_has_contact boolean; v_has_deal boolean; v_days_since_first int;
BEGIN
  SELECT COUNT(*) INTO v_int_count FROM interactions WHERE company_id = p_company_id;
  SELECT EXISTS(SELECT 1 FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL) INTO v_has_contact;
  SELECT EXISTS(SELECT 1 FROM deals WHERE company_id = p_company_id) INTO v_has_deal;
  SELECT EXTRACT(DAY FROM NOW() - (SELECT MIN(data_interacao) FROM interactions WHERE company_id = p_company_id))::int INTO v_days_since_first;
  
  IF v_has_deal THEN v_score := v_score + 40; END IF;
  IF v_has_contact THEN v_score := v_score + 20; END IF;
  IF v_int_count >= 5 THEN v_score := v_score + 20; ELSIF v_int_count >= 2 THEN v_score := v_score + 10; END IF;
  IF v_days_since_first >= 30 THEN v_score := v_score + 20; ELSIF v_days_since_first >= 7 THEN v_score := v_score + 10; END IF;
  
  RETURN CASE 
    WHEN v_score >= 80 THEN 'Qualificado'
    WHEN v_score >= 60 THEN 'Engajado'
    WHEN v_score >= 40 THEN 'Interessado'
    WHEN v_score >= 20 THEN 'Prospectado'
    ELSE 'Novo'
  END;
END;
$function$
