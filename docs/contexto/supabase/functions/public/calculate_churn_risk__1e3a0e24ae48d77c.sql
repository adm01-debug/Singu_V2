CREATE OR REPLACE FUNCTION public.calculate_churn_risk(p_company_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_days_inactive int; v_deal_trend numeric; v_int_trend numeric;
BEGIN
  SELECT EXTRACT(DAY FROM NOW() - MAX(data_interacao))::int INTO v_days_inactive FROM interactions WHERE company_id = p_company_id;
  
  IF v_days_inactive IS NULL THEN RETURN 'CRÍTICO'; END IF;
  IF v_days_inactive > 90 THEN RETURN 'CRÍTICO'; END IF;
  IF v_days_inactive > 60 THEN RETURN 'ALTO'; END IF;
  IF v_days_inactive > 30 THEN RETURN 'MÉDIO'; END IF;
  RETURN 'BAIXO';
END;
$function$
