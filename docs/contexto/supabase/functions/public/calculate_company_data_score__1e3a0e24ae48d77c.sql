CREATE OR REPLACE FUNCTION public.calculate_company_data_score(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM companies WHERE id = p_company_id AND cnpj IS NOT NULL AND LENGTH(cnpj) >= 11) THEN v_score := v_score + 20; END IF;
  IF EXISTS (SELECT 1 FROM companies WHERE id = p_company_id AND nome_fantasia IS NOT NULL) THEN v_score := v_score + 10; END IF;
  IF EXISTS (SELECT 1 FROM company_emails WHERE company_id = p_company_id) THEN v_score := v_score + 20; END IF;
  IF EXISTS (SELECT 1 FROM company_phones WHERE company_id = p_company_id) THEN v_score := v_score + 20; END IF;
  IF EXISTS (SELECT 1 FROM companies WHERE id = p_company_id AND user_id IS NOT NULL) THEN v_score := v_score + 15; END IF;
  IF EXISTS (SELECT 1 FROM interactions WHERE company_id = p_company_id) THEN v_score := v_score + 15; END IF;
  RETURN v_score;
END;
$function$
