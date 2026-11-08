CREATE OR REPLACE FUNCTION public.refresh_sequence_enrollment_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE target_id uuid;
BEGIN
  target_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.sequence_id ELSE NEW.sequence_id END;
  UPDATE public.sequences SET total_enrolled = (
    SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = target_id
  ) WHERE id = target_id;
  RETURN NULL;
END;
$function$
