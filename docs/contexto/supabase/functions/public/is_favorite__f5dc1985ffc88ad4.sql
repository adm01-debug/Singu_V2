CREATE OR REPLACE FUNCTION public.is_favorite(p_entity_type text, p_entity_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN EXISTS(
    SELECT 1 FROM favorites 
    WHERE user_id = p_user_id 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id
  );
EXCEPTION WHEN undefined_table THEN
  RETURN false;
END;
$function$
