CREATE OR REPLACE FUNCTION public.guard_contact_sequence_archive()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id THEN
      RETURN NEW;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.sequence_email_reservations WHERE contact_id = OLD.id) THEN
    RAISE EXCEPTION 'Envio em andamento ou sem confirmação; aguarde a conclusão antes de arquivar'
      USING ERRCODE = '55000';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF NEW.deleted_at IS NOT NULL OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    UPDATE public.sequence_enrollments SET status = 'paused', paused_at = now(),
      paused_reason = 'Contato arquivado ou transferido'
    WHERE contact_id = OLD.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$function$
