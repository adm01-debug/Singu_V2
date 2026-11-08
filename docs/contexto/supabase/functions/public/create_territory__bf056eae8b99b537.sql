CREATE OR REPLACE FUNCTION public.create_territory(p_name text, p_description text DEFAULT NULL::text, p_manager_id uuid DEFAULT NULL::uuid, p_states text[] DEFAULT '{}'::text[], p_cities text[] DEFAULT '{}'::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO territories (name, description, manager_id, states, cities)
  VALUES (p_name, p_description, p_manager_id, p_states, p_cities)
  RETURNING id INTO v_id;
  
  RETURN jsonb_build_object('success', true, 'territory_id', v_id);
END;
$function$
