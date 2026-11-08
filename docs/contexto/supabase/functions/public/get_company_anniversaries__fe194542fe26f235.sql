CREATE OR REPLACE FUNCTION public.get_company_anniversaries(p_days_ahead integer DEFAULT 30, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(company_id uuid, trade_name text, created_at timestamp with time zone, anniversary_date date, years_as_client integer, days_until integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as trade_name,
    c.created_at,
    (DATE_TRUNC('year', CURRENT_DATE) + (c.created_at::date - DATE_TRUNC('year', c.created_at)::date))::date as anniversary_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.created_at::date))::int as years_as_client,
    (DATE_TRUNC('year', CURRENT_DATE) + (c.created_at::date - DATE_TRUNC('year', c.created_at)::date) - CURRENT_DATE)::int as days_until
  FROM companies c
  WHERE c.status = 'ativo'
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
    AND c.created_at < NOW() - interval '1 year'
    AND (DATE_TRUNC('year', CURRENT_DATE) + (c.created_at::date - DATE_TRUNC('year', c.created_at)::date))::date 
        BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
  ORDER BY days_until;
END;
$function$
