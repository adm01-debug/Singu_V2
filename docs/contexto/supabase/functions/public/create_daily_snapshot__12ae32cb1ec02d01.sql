CREATE OR REPLACE FUNCTION public.create_daily_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  snapshot_date date := CURRENT_DATE;
BEGIN
  -- Cria registro na tabela de snapshots (se existir)
  -- Por ora, apenas retorna os dados do snapshot
  SELECT jsonb_build_object(
    'snapshot_date', snapshot_date,
    'metricas', jsonb_build_object(
      'empresas', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
        'ativas', (SELECT COUNT(*) FROM companies WHERE status = 'ativo' AND deleted_at IS NULL),
        'novas_hoje', (SELECT COUNT(*) FROM companies WHERE created_at::date = snapshot_date AND deleted_at IS NULL)
      ),
      'contatos', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
        'novos_hoje', (SELECT COUNT(*) FROM contacts WHERE created_at::date = snapshot_date AND deleted_at IS NULL)
      ),
      'clientes', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
        'ativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
        'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL)
      ),
      'interacoes', jsonb_build_object(
        'total', (SELECT COUNT(*) FROM interactions),
        'hoje', (SELECT COUNT(*) FROM interactions WHERE created_at::date = snapshot_date)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
