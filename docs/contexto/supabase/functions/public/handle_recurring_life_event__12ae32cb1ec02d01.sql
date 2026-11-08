CREATE OR REPLACE FUNCTION public.handle_recurring_life_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If event is recurring and date has passed, we could optionally move it forward,
    -- but usually for CRM we just need to ensure the next year's reminder works.
    -- This trigger can be expanded for more complex logic.
    RETURN NEW;
END;
$function$
