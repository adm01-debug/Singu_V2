CREATE OR REPLACE FUNCTION public.get_salesperson_dashboard(p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor', (SELECT row_to_json(s) FROM (SELECT id, nome, email FROM salespeople WHERE id = p_vendedor_id) s),
    'hoje', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at::date = CURRENT_DATE),
      'empresas_atendidas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at::date = CURRENT_DATE),
      'followups_pendentes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND followup_pendente = true AND data_followup::date = CURRENT_DATE)
    ),
    'semana', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_trunc('week', now())),
      'empresas_atendidas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_trunc('week', now()))
    ),
    'carteira', jsonb_build_object(
      'total_clientes', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL)
    ),
    'alertas_pendentes', (SELECT COUNT(*) FROM alerts a JOIN customers cu ON cu.company_id = a.company_id WHERE cu.vendedor_id = p_vendedor_id AND a.resolved_at IS NULL),
    'proximos_followups', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.data_followup)
      FROM (
        SELECT i.id, c.nome_crm, i.data_followup, i.tipo_interacao
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.usuario_responsavel_id = p_vendedor_id
        AND i.followup_pendente = true
        AND i.data_followup >= now()
        ORDER BY i.data_followup
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
