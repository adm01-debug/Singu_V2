CREATE OR REPLACE FUNCTION public.widget_alerts()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL),
    'alta_prioridade', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL AND prioridade = 'high'),
    'resolvidos_hoje', (SELECT COUNT(*) FROM alerts WHERE resolved_at::date = CURRENT_DATE),
    'criados_hoje', (SELECT COUNT(*) FROM alerts WHERE created_at::date = CURRENT_DATE)
  );
END;
$function$
