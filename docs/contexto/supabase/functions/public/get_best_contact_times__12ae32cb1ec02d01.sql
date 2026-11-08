CREATE OR REPLACE FUNCTION public.get_best_contact_times()
 RETURNS TABLE(hour_range text, interactions bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN EXTRACT(HOUR FROM data_interacao) BETWEEN 8 AND 11 THEN '08-12h'
    WHEN EXTRACT(HOUR FROM data_interacao) BETWEEN 12 AND 14 THEN '12-14h'
    WHEN EXTRACT(HOUR FROM data_interacao) BETWEEN 14 AND 18 THEN '14-18h' ELSE 'Outros' END, COUNT(*)
  FROM interactions GROUP BY 1 ORDER BY 2 DESC;
$function$
