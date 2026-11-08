CREATE OR REPLACE FUNCTION public.get_touchpoint_summary(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_touchpoints', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
    'by_channel', (SELECT jsonb_object_agg(channel, cnt) FROM (SELECT channel, COUNT(*) as cnt FROM interactions WHERE company_id = p_company_id GROUP BY channel) sub),
    'by_type', (SELECT jsonb_object_agg(type, cnt) FROM (SELECT type, COUNT(*) as cnt FROM interactions WHERE company_id = p_company_id GROUP BY type) sub),
    'first_touchpoint', (SELECT MIN(data_interacao) FROM interactions WHERE company_id = p_company_id),
    'last_touchpoint', (SELECT MAX(data_interacao) FROM interactions WHERE company_id = p_company_id),
    'avg_days_between', (SELECT ROUND(AVG(days), 1) FROM (SELECT EXTRACT(DAY FROM data_interacao - LAG(data_interacao) OVER (ORDER BY data_interacao)) as days FROM interactions WHERE company_id = p_company_id) sub WHERE days IS NOT NULL)
  );
END;
$function$
