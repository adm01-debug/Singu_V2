CREATE OR REPLACE FUNCTION public.get_portfolio_capacity()
 RETURNS TABLE(user_id uuid, user_name text, total_companies bigint, active_deals bigint, pipeline_value numeric, last_30_days_interactions bigint, capacity_score numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.full_name, p.email)::text as user_name,
    COALESCE((SELECT COUNT(*) FROM companies c WHERE c.user_id = p.id AND c.deleted_at IS NULL), 0)::bigint as total_companies,
    COALESCE((SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status NOT IN ('ganho', 'perdido', 'arquivado')), 0)::bigint as active_deals,
    COALESCE((SELECT SUM(valor) FROM deals d WHERE d.user_id = p.id AND d.status NOT IN ('ganho', 'perdido', 'arquivado')), 0)::numeric as pipeline_value,
    COALESCE((SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p.id AND i.data_interacao >= CURRENT_DATE - 30), 0)::bigint as last_30_days_interactions,
    -- Score: quanto menor, mais capacidade disponível
    ROUND((
      COALESCE((SELECT COUNT(*) FROM companies c WHERE c.user_id = p.id AND c.deleted_at IS NULL), 0) * 0.3 +
      COALESCE((SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status NOT IN ('ganho', 'perdido', 'arquivado')), 0) * 0.5 +
      COALESCE((SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p.id AND i.data_interacao >= CURRENT_DATE - 7), 0) * 0.2
    )::numeric, 1) as capacity_score
  FROM profiles p
  WHERE p.is_active = true
  ORDER BY capacity_score ASC;
END;
$function$
