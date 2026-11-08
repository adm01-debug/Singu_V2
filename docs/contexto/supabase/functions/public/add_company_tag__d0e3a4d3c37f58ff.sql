CREATE OR REPLACE FUNCTION public.add_company_tag(p_company_id uuid, p_tag text, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_tags text[];
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT COALESCE(tags_array, ARRAY[]::text[]) INTO v_current_tags
  FROM companies WHERE id = p_company_id;
  
  IF p_tag = ANY(v_current_tags) THEN
    RETURN false;
  END IF;
  
  UPDATE companies 
  SET tags_array = array_append(COALESCE(tags_array, ARRAY[]::text[]), LOWER(TRIM(p_tag))),
      updated_at = NOW()
  WHERE id = p_company_id;
  
  RETURN FOUND;
END;
$function$
