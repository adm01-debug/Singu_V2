CREATE OR REPLACE FUNCTION public.update_import_progress(p_job_id uuid, p_processed integer, p_success integer, p_errors jsonb DEFAULT NULL::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE import_jobs SET
    processed_rows = p_processed,
    success_rows = p_success,
    error_rows = p_processed - p_success,
    errors = COALESCE(p_errors, errors),
    status = CASE WHEN p_processed >= total_rows THEN 'completed' ELSE 'importing' END,
    completed_at = CASE WHEN p_processed >= total_rows THEN NOW() ELSE NULL END
  WHERE id = p_job_id;
  RETURN FOUND;
END;
$function$
