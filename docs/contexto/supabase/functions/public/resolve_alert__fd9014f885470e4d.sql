CREATE OR REPLACE FUNCTION public.resolve_alert(p_alert_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_alert_access(p_alert_id);
  UPDATE alerts SET resolved_at = now() WHERE id = p_alert_id AND resolved_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  IF affected = 0 THEN
    SELECT jsonb_build_object(
      'success', false,
      'message', 'Alerta não encontrado ou já resolvido'
    ) INTO result;
  ELSE
    SELECT jsonb_build_object(
      'success', true,
      'alert_id', p_alert_id,
      'resolved_at', now(),
      'message', 'Alerta resolvido com sucesso'
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
