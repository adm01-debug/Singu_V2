CREATE OR REPLACE FUNCTION public.get_interaction_counts_by_type(p_company_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(COALESCE(tipo_interacao, 'outros'), cnt)
  INTO result
  FROM (
    SELECT tipo_interacao, COUNT(*) as cnt
    FROM interactions
    WHERE (p_company_id IS NULL OR company_id = p_company_id)
    GROUP BY tipo_interacao
  ) t;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$
