CREATE OR REPLACE FUNCTION public.trigger_aggregate_nlp_to_company()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (NEW.company_id IS NOT NULL) THEN
        PERFORM public.aggregate_nlp_to_company(NEW.company_id);
    END IF;
    IF (OLD.company_id IS NOT NULL AND OLD.company_id != COALESCE(NEW.company_id, '00000000-0000-0000-0000-000000000000'::UUID)) THEN
        PERFORM public.aggregate_nlp_to_company(OLD.company_id);
    END IF;
    RETURN NEW;
END;
$function$
