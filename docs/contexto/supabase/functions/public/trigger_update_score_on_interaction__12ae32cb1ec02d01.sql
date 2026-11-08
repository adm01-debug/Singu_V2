CREATE OR REPLACE FUNCTION public.trigger_update_score_on_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    PERFORM calculate_relationship_score(NEW.contact_id);
    RETURN NEW;
END;
$function$
