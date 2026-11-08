CREATE OR REPLACE FUNCTION public.suggest_tags(p_company_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_ramo text; v_suggested text[] := '{}';
BEGIN
  SELECT ramo_atividade INTO v_ramo FROM companies WHERE id = p_company_id;
  SELECT ARRAY_AGG(DISTINCT t) INTO v_suggested FROM (
    SELECT UNNEST(c.tags_array) as t FROM companies c WHERE c.ramo_atividade = v_ramo AND c.id != p_company_id LIMIT 20
  ) sub;
  RETURN COALESCE(v_suggested, '{}');
END;
$function$
