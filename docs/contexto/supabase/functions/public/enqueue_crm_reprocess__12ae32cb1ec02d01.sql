CREATE OR REPLACE FUNCTION public.enqueue_crm_reprocess()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.status = 'error' THEN
        INSERT INTO public.crm_automation_reprocess_queue (log_id, next_retry_at)
        VALUES (NEW.id, now() + interval '5 minutes');
    END IF;
    RETURN NEW;
END;
$function$
