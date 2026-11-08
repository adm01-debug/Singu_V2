CREATE OR REPLACE FUNCTION public.get_system_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'database', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'clientes', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions),
      'alertas', (SELECT COUNT(*) FROM alerts),
      'vendedores', (SELECT COUNT(*) FROM salespeople)
    ),
    'atividade_24h', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '24 hours' AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '24 hours'),
      'alertas_criados', (SELECT COUNT(*) FROM alerts WHERE created_at >= now() - interval '24 hours'),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at >= now() - interval '24 hours')
    ),
    'saude', jsonb_build_object(
      'alertas_pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL),
      'followups_atrasados', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now()),
      'empresas_sem_contato_30d', (
        SELECT COUNT(*) FROM companies c
        WHERE c.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - interval '30 days')
      )
    ),
    'financeiro', jsonb_build_object(
      'valor_total_carteira', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL),
      'ticket_medio', (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
