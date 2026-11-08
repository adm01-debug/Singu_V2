CREATE OR REPLACE FUNCTION public.prepare_webhook_payload(p_event_type text, p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Redireciona para a versão principal
  RETURN prepare_webhook_payload(p_company_id, p_event_type);
END;
$function$
