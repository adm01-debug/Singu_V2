CREATE OR REPLACE FUNCTION public.trigger_log_deal_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_name text;
BEGIN
  SELECT COALESCE(nome_fantasia, nome_crm, razao_social) INTO v_company_name FROM companies WHERE id = NEW.company_id;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(NEW.user_id, 'created', 'deal', NEW.id, NEW.titulo, 
      'Criou deal "' || NEW.titulo || '" para ' || v_company_name);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_activity(NEW.user_id, 'status_changed', 'deal', NEW.id, NEW.titulo,
      'Deal "' || NEW.titulo || '" mudou para ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$function$
