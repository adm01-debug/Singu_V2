CREATE OR REPLACE FUNCTION public.calculate_ticket_medio(p_days integer DEFAULT 365)
 RETURNS numeric
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT ROUND(AVG(valor), 2) FROM deals WHERE status = 'ganho' AND closed_at >= NOW() - (p_days || ' days')::interval;
$function$
