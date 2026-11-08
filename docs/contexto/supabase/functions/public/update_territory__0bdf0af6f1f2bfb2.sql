CREATE OR REPLACE FUNCTION public.update_territory(p_territory_id uuid, p_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_states text[] DEFAULT NULL::text[], p_cities text[] DEFAULT NULL::text[], p_is_active boolean DEFAULT NULL::boolean, p_manager_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  -- Somente o gestor do território (ou service_role, auth.uid() nulo) pode editá-lo
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM territories t WHERE t.id = p_territory_id AND t.manager_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: territory % is not managed by the current user', p_territory_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE territories SET
    name        = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    states      = COALESCE(p_states, states),
    cities      = COALESCE(p_cities, cities),
    is_active   = COALESCE(p_is_active, is_active),
    manager_id  = COALESCE(p_manager_id, manager_id)
  WHERE id = p_territory_id;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Território não encontrado');
  END IF;
  RETURN jsonb_build_object('success', true, 'territory_id', p_territory_id);
END;
$function$
