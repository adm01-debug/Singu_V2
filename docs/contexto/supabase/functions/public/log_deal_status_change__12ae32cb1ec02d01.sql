CREATE OR REPLACE FUNCTION public.log_deal_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
     AND (NEW.company_id IS NOT NULL OR NEW.contact_id IS NOT NULL) THEN
    INSERT INTO interactions (company_id, contact_id, type, channel, direction, resumo, content, user_id, data_interacao)
    VALUES (
      NEW.company_id, NEW.contact_id, 'system', 'system', 'outbound',
      'Deal "' || LEFT(NEW.titulo, 30) || '" movido para ' || COALESCE(NEW.pipeline_stage, NEW.status),
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'old_stage', OLD.pipeline_stage, 'new_stage', NEW.pipeline_stage)::text,
      NEW.user_id, NOW()
    );
  END IF;
  RETURN NEW;
END;
$function$
