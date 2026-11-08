CREATE OR REPLACE FUNCTION public.widget_salespeople()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total', (SELECT COUNT(*) FROM salespeople),
    'ativos_semana', (SELECT COUNT(DISTINCT usuario_responsavel_id) FROM interactions WHERE created_at >= date_trunc('week', now())),
    'com_clientes', (SELECT COUNT(DISTINCT vendedor_id) FROM customers WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL)
  );
END;
$function$
