CREATE OR REPLACE FUNCTION public.fn_set_novelty_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$function$
