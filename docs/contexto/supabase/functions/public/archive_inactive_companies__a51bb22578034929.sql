CREATE OR REPLACE FUNCTION public.archive_inactive_companies(p_inactivity_days integer DEFAULT 365)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_archived int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE companies c
  SET status = 'arquivado', updated_at = NOW()
  WHERE c.deleted_at IS NULL
    AND c.status = 'ativo'
    AND NOT EXISTS (
      SELECT 1 FROM interactions i 
      WHERE i.company_id = c.id 
      AND i.data_interacao >= NOW() - (p_inactivity_days || ' days')::interval
    )
    AND c.created_at < NOW() - (p_inactivity_days || ' days')::interval;
  
  GET DIAGNOSTICS v_archived = ROW_COUNT;
  RETURN v_archived;
END;
$function$
