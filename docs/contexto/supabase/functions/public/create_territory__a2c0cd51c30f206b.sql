CREATE OR REPLACE FUNCTION public.create_territory(p_name text, p_manager_id uuid, p_states text[] DEFAULT '{}'::text[], p_cities text[] DEFAULT '{}'::text[], p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_territory_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO territories (name, manager_id, states, cities, description)
  VALUES (p_name, p_manager_id, p_states, p_cities, p_description)
  RETURNING id INTO v_territory_id;
  RETURN v_territory_id;
END;
$function$
