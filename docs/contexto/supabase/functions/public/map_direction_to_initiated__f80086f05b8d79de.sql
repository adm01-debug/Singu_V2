CREATE OR REPLACE FUNCTION public.map_direction_to_initiated(dir text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN CASE dir
        WHEN 'inbound' THEN 'them'
        WHEN 'outbound' THEN 'us'
        ELSE 'us'
    END;
END;
$function$
