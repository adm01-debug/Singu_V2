CREATE OR REPLACE FUNCTION public.remove_company_tag(p_company_id uuid, p_tag text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE companies
  SET tags_array = array_remove(tags_array, LOWER(TRIM(p_tag))),
      updated_at = NOW()
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  RETURN FOUND;
END;
$function$
