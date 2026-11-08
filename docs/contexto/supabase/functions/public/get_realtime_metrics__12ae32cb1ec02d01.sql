CREATE OR REPLACE FUNCTION public.get_realtime_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'timestamp', now(),
    'agora', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'clientes', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL)
    ),
    'hoje', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at::date = CURRENT_DATE)
    ),
    'pendencias', jsonb_build_object(
      'alertas', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL),
      'followups', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup <= now())
    )
  );
END;
$function$
