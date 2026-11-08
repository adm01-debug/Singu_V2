CREATE OR REPLACE FUNCTION public.singu_delete(p_table text, p_user_id uuid, p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  allowed      text[];
  rows_deleted integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  allowed := get_singu_allowed_tables();
  IF NOT (p_table = ANY(allowed)) THEN
    RAISE EXCEPTION 'Table % not allowed', p_table;
  END IF;

  -- Use parameterized USING — values never string-interpolated
  EXECUTE format('DELETE FROM public.%I WHERE id = $1 AND user_id = $2', p_table)
    USING p_id, auth.uid();
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN rows_deleted > 0;
END;
$function$
