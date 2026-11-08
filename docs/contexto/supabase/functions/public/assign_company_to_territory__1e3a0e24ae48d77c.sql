CREATE OR REPLACE FUNCTION public.assign_company_to_territory(p_company_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_state text;
  v_city text;
  v_territory territories%ROWTYPE;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  SELECT ca.estado, ca.cidade INTO v_state, v_city
  FROM company_addresses ca WHERE ca.company_id = p_company_id LIMIT 1;
  
  IF v_state IS NULL THEN RETURN NULL; END IF;
  
  SELECT * INTO v_territory
  FROM territories t
  WHERE t.is_active = true
    AND (v_state = ANY(t.states) OR v_city = ANY(t.cities))
  LIMIT 1;
  
  IF v_territory.id IS NOT NULL THEN
    UPDATE companies SET user_id = v_territory.manager_id WHERE id = p_company_id;
    RETURN v_territory.id;
  END IF;
  
  RETURN NULL;
END;
$function$
