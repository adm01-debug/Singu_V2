CREATE OR REPLACE FUNCTION public.add_tag(p_company_id uuid, p_tag text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE companies
  SET tags_array = array_append(COALESCE(tags_array, '{}'), p_tag)
  WHERE id = p_company_id
    AND NOT (p_tag = ANY(COALESCE(tags_array, '{}')))
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  RETURN FOUND;
END;
$function$
