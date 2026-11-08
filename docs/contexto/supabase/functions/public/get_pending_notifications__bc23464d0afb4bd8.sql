CREATE OR REPLACE FUNCTION public.get_pending_notifications(p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'timestamp', now(),
    'followups_hoje', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT i.id, c.nome_crm, i.resumo_interacao, i.data_followup
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.usuario_responsavel_id = p_vendedor_id
        AND i.followup_pendente = true
        AND i.data_followup::date = CURRENT_DATE
        ORDER BY i.data_followup
        LIMIT 10
      ) t
    ),
    'followups_atrasados', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT i.id, c.nome_crm, i.data_followup, EXTRACT(DAY FROM now() - i.data_followup)::int as dias_atraso
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.usuario_responsavel_id = p_vendedor_id
        AND i.followup_pendente = true
        AND i.data_followup < CURRENT_DATE
        ORDER BY i.data_followup
        LIMIT 10
      ) t
    ),
    'alertas_urgentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT a.id, a.tipo, a.mensagem, c.nome_crm
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        JOIN customers cu ON cu.company_id = a.company_id
        WHERE cu.vendedor_id = p_vendedor_id
        AND a.resolved_at IS NULL
        AND a.prioridade = 'high'
        LIMIT 5
      ) t
    ),
    'clientes_sem_contato_30d', (
      SELECT COUNT(*)
      FROM customers cu
      JOIN companies c ON c.id = cu.company_id
      WHERE cu.vendedor_id = p_vendedor_id
      AND cu.cliente_ativado = true
      AND cu.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM interactions i 
        WHERE i.company_id = cu.company_id 
        AND i.created_at >= now() - interval '30 days'
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
