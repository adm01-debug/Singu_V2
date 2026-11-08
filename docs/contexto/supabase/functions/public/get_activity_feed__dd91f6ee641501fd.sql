CREATE OR REPLACE FUNCTION public.get_activity_feed(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, user_id uuid, user_name text, activity_type text, entity_type text, entity_id uuid, entity_name text, description text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT af.id, af.user_id, pr.full_name::text as user_name, af.activity_type::text, af.entity_type::text, 
         af.entity_id, af.entity_name::text, af.description::text, af.created_at
  FROM activity_feed af
  LEFT JOIN profiles pr ON pr.id = af.user_id
  WHERE p_user_id IS NULL OR af.user_id = p_user_id
  ORDER BY af.created_at DESC
  LIMIT p_limit;
END;
$function$
