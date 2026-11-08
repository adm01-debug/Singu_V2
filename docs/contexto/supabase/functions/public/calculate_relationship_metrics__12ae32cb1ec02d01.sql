CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.calculate_relationship_metrics_internal(OLD.contact_id);
    ELSE
        PERFORM public.calculate_relationship_metrics_internal(NEW.contact_id);
    END IF;
    RETURN NULL;
END;
$function$
