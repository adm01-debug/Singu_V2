CREATE OR REPLACE FUNCTION public.create_auto_alert(p_company_id uuid, p_tipo text, p_mensagem text, p_prioridade text DEFAULT 'normal'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO alerts (company_id, tipo, mensagem, prioridade)
  VALUES (p_company_id, p_tipo, p_mensagem, p_prioridade)
  RETURNING id INTO new_id;
  
  RETURN jsonb_build_object('success', true, 'alert_id', new_id);
END;
$function$
