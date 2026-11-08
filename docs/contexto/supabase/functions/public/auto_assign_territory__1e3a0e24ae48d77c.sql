CREATE OR REPLACE FUNCTION public.auto_assign_territory(p_company_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_state text; v_territory_id uuid;
BEGIN
  SELECT ca.estado INTO v_state FROM company_addresses ca WHERE ca.company_id = p_company_id LIMIT 1;
  IF v_state IS NULL THEN RETURN NULL; END IF;
  
  SELECT id INTO v_territory_id FROM territories WHERE v_state = ANY(states) AND is_active = true LIMIT 1;
  RETURN v_territory_id;
END;
$function$
