CREATE OR REPLACE FUNCTION public.find_duplicate_emails(p_limit integer DEFAULT 50)
 RETURNS TABLE(email text, quantidade bigint, empresas jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT lower(btrim(ce.email)), count(DISTINCT c.id),
    jsonb_agg(DISTINCT jsonb_build_object('id', c.id, 'nome_crm', c.nome_crm))
  FROM public.company_emails ce
  JOIN public.companies c ON c.id = ce.company_id
  WHERE c.deleted_at IS NULL AND nullif(btrim(ce.email), '') IS NOT NULL
  GROUP BY lower(btrim(ce.email))
  HAVING count(DISTINCT c.id) > 1
  ORDER BY count(DISTINCT c.id) DESC, lower(btrim(ce.email))
  LIMIT p_limit;
END;
$function$
