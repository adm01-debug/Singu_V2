CREATE OR REPLACE FUNCTION public.export_deals_full(p_filters jsonb DEFAULT '{}'::jsonb, p_limit integer DEFAULT 5000)
 RETURNS TABLE(id uuid, titulo text, company_name text, valor numeric, status text, pipeline_stage text, probabilidade integer, previsao_fechamento date, user_name text, created_at timestamp with time zone, closed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.titulo::text,
    COALESCE(c.nome_fantasia, c.nome_crm)::text as company_name,
    d.valor,
    d.status::text,
    d.pipeline_stage::text,
    d.probabilidade,
    d.previsao_fechamento,
    pr.full_name::text as user_name,
    d.created_at,
    d.closed_at
  FROM deals d
  LEFT JOIN companies c ON c.id = d.company_id
  LEFT JOIN profiles pr ON pr.id = d.user_id
  WHERE (p_filters->>'status' IS NULL OR d.status = p_filters->>'status')
    AND (p_filters->>'user_id' IS NULL OR d.user_id = (p_filters->>'user_id')::uuid)
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$function$
