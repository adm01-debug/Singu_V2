CREATE OR REPLACE FUNCTION public.generate_auto_daily_report()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'data', CURRENT_DATE,
    'gerado_em', now(),
    'resumo_dia', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL),
      'contatos_novos', (SELECT COUNT(*) FROM contacts WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'alertas_criados', (SELECT COUNT(*) FROM alerts WHERE created_at::date = CURRENT_DATE),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at::date = CURRENT_DATE)
    ),
    'destaques', jsonb_build_object(
      'vendedor_mais_ativo', (
        SELECT jsonb_build_object('nome', s.nome, 'interacoes', COUNT(i.id))
        FROM salespeople s
        JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at::date = CURRENT_DATE
        GROUP BY s.id, s.nome
        ORDER BY COUNT(i.id) DESC
        LIMIT 1
      ),
      'maior_venda', (
        SELECT jsonb_build_object('empresa', c.nome_crm, 'valor', cu.valor_total_compras)
        FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.ja_comprou = true AND cu.updated_at::date = CURRENT_DATE AND cu.deleted_at IS NULL
        ORDER BY cu.valor_total_compras DESC
        LIMIT 1
      )
    ),
    'pendencias', jsonb_build_object(
      'followups_atrasados', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < CURRENT_DATE),
      'alertas_pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
