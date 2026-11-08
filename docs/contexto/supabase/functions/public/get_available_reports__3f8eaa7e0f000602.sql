CREATE OR REPLACE FUNCTION public.get_available_reports(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, name text, description text, report_type text, is_public boolean, owner_name text, run_count integer, last_run_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.report_type,
    r.is_public,
    p.full_name as owner_name,
    r.run_count,
    r.last_run_at
  FROM custom_reports r
  LEFT JOIN profiles p ON p.id = r.user_id
  WHERE r.is_public = true OR r.user_id = p_user_id
  ORDER BY r.run_count DESC, r.name;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
