CREATE OR REPLACE FUNCTION public.create_import_job(p_name text, p_entity_type text, p_file_name text, p_total_rows integer, p_mapping jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO import_jobs (name, entity_type, file_name, total_rows, mapping, created_by)
  VALUES (p_name, p_entity_type, p_file_name, p_total_rows, p_mapping, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
