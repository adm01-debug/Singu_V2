CREATE OR REPLACE FUNCTION public.bulk_add_tag(p_company_ids uuid[], p_tag text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_count int;
BEGIN
  UPDATE companies
  SET tags_array = array_append(COALESCE(tags_array, '{}'), p_tag)
  WHERE id = ANY(p_company_ids)
    AND NOT (p_tag = ANY(COALESCE(tags_array, '{}')))
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
