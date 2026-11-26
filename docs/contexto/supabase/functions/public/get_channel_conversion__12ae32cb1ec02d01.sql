CREATE OR REPLACE FUNCTION public.get_channel_conversion()
 RETURNS TABLE(channel text, first_contact_count bigint, converted_count bigint, conversion_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH first_contact AS (
    SELECT company_id, channel, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY data_interacao) as rn
    FROM interactions
  )
  SELECT fc.channel, COUNT(DISTINCT fc.company_id),
    COUNT(DISTINCT fc.company_id) FILTER (WHERE EXISTS (SELECT 1 FROM deals d WHERE d.company_id = fc.company_id AND d.status = 'ganho')),
    ROUND(COUNT(DISTINCT fc.company_id) FILTER (WHERE EXISTS (SELECT 1 FROM deals d WHERE d.company_id = fc.company_id AND d.status = 'ganho'))::numeric / NULLIF(COUNT(DISTINCT fc.company_id), 0) * 100, 1)
  FROM first_contact fc WHERE fc.rn = 1 GROUP BY fc.channel ORDER BY 4 DESC NULLS LAST;
$function$
