CREATE OR REPLACE FUNCTION public.get_best_contact_times(p_contact_id uuid)
 RETURNS TABLE(day_of_week integer, hour_of_day integer, response_rate numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ta.day_of_week,
        ta.hour_of_day,
        ROUND(ta.success_count::numeric / NULLIF(ta.total_attempts, 0), 3) AS response_rate
    FROM contact_time_analysis ta
    WHERE ta.contact_id = p_contact_id
    ORDER BY response_rate DESC
    LIMIT 3;
END;
$function$
