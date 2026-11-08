CREATE OR REPLACE FUNCTION public.get_optimal_contact_windows()
 RETURNS TABLE(window_name text, success_rate numeric, total_interactions bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH windows AS (
    SELECT i.id, i.company_id,
      CASE 
        WHEN EXTRACT(HOUR FROM i.data_interacao) BETWEEN 9 AND 11 THEN 'Manhã (9-12h)'
        WHEN EXTRACT(HOUR FROM i.data_interacao) BETWEEN 14 AND 17 THEN 'Tarde (14-18h)'
        ELSE 'Outros'
      END as window_name
    FROM interactions i WHERE i.data_interacao >= NOW() - interval '180 days'
  )
  SELECT window_name, 
    ROUND(COUNT(DISTINCT company_id) FILTER (WHERE EXISTS (SELECT 1 FROM deals d WHERE d.company_id = windows.company_id AND d.status = 'ganho'))::numeric / NULLIF(COUNT(DISTINCT company_id), 0) * 100, 1),
    COUNT(*)
  FROM windows GROUP BY window_name ORDER BY 2 DESC;
$function$
