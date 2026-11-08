CREATE OR REPLACE FUNCTION public.get_daily_agenda(p_vendedor_id integer DEFAULT NULL::integer, p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'data', p_date,
    'vendedor_id', p_vendedor_id,
    'followups_agendados', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.data_followup)
      FROM (
        SELECT i.id, c.nome_crm, i.data_followup, i.resumo_interacao, i.canal
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.followup_pendente = true
        AND i.data_followup::date = p_date
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        ORDER BY i.data_followup
      ) t
    ),
    'alertas_urgentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT a.id, a.tipo, a.mensagem, c.nome_crm
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.resolved_at IS NULL AND a.prioridade = 'high'
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
        LIMIT 5
      ) t
    ),
    'followups_atrasados', (
      SELECT COUNT(*) FROM interactions i
      LEFT JOIN customers cu ON cu.company_id = i.company_id
      WHERE i.followup_pendente = true AND i.data_followup < p_date
      AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
