CREATE OR REPLACE FUNCTION public.calculate_interaction_frequency(p_company_id uuid DEFAULT NULL::uuid, p_months integer DEFAULT 6)
 RETURNS TABLE(company_id uuid, company_name text, total_interactions bigint, avg_per_month numeric, last_30_days bigint, trend text, engagement_level text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH monthly_counts AS (
    SELECT 
      i.company_id as cid,
      DATE_TRUNC('month', i.created_at) as month,
      COUNT(*) as cnt
    FROM interactions i
    WHERE i.created_at >= NOW() - (p_months || ' months')::INTERVAL
      AND (p_company_id IS NULL OR i.company_id = p_company_id)
    GROUP BY i.company_id, DATE_TRUNC('month', i.created_at)
  ),
  stats AS (
    SELECT 
      cid,
      SUM(cnt) as total,
      AVG(cnt) as avg_monthly,
      (SELECT COALESCE(SUM(cnt), 0) FROM monthly_counts mc2 
       WHERE mc2.cid = mc1.cid AND month >= DATE_TRUNC('month', NOW())) as recent
    FROM monthly_counts mc1
    GROUP BY cid
  )
  SELECT 
    c.id,
    c.nome_fantasia::TEXT,
    COALESCE(s.total, 0),
    ROUND(COALESCE(s.avg_monthly, 0), 2),
    COALESCE(s.recent, 0),
    CASE 
      WHEN s.recent > s.avg_monthly * 1.5 THEN 'crescente'
      WHEN s.recent < s.avg_monthly * 0.5 THEN 'decrescente'
      ELSE 'estável'
    END,
    CASE 
      WHEN s.avg_monthly >= 10 THEN 'alto'
      WHEN s.avg_monthly >= 4 THEN 'médio'
      WHEN s.avg_monthly >= 1 THEN 'baixo'
      ELSE 'inativo'
    END
  FROM companies c
  LEFT JOIN stats s ON s.cid = c.id
  WHERE c.deleted_at IS NULL
    AND (p_company_id IS NULL OR c.id = p_company_id)
  ORDER BY s.avg_monthly DESC NULLS LAST;
END;
$function$
