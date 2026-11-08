CREATE OR REPLACE FUNCTION public.get_days_without_contact(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_interaction timestamptz;
BEGIN
  SELECT MAX(data_interacao) INTO v_last_interaction
  FROM interactions
  WHERE company_id = p_company_id;
  
  IF v_last_interaction IS NULL THEN
    SELECT created_at INTO v_last_interaction
    FROM companies WHERE id = p_company_id;
  END IF;
  
  RETURN EXTRACT(DAY FROM NOW() - v_last_interaction)::int;
END;
$function$
