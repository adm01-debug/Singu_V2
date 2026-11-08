CREATE OR REPLACE FUNCTION public.widget_activity()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'interacoes_hoje', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
    'interacoes_semana', (SELECT COUNT(*) FROM interactions WHERE created_at >= date_trunc('week', now())),
    'empresas_novas_semana', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('week', now()) AND deleted_at IS NULL),
    'clientes_ativados_semana', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= date_trunc('week', now()) AND deleted_at IS NULL)
  );
END;
$function$
