CREATE OR REPLACE FUNCTION public.widget_quick_counts()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'empresas', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
    'contatos', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
    'clientes', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
    'interacoes_hoje', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
    'alertas_pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL),
    'followups_atrasados', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now())
  );
END;
$function$
