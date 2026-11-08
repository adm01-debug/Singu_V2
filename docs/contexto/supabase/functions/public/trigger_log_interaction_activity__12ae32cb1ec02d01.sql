CREATE OR REPLACE FUNCTION public.trigger_log_interaction_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_name text;
BEGIN
  IF TG_OP <> 'INSERT' OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(nome_fantasia, nome_crm, razao_social)
  INTO v_company_name
  FROM public.companies
  WHERE id = NEW.company_id;

  PERFORM public.log_activity(NEW.user_id, 'created', 'interaction', NEW.id, NEW.type,
    'Registrou ' || NEW.type || ' com ' || v_company_name);
  RETURN NEW;
END;
$function$
