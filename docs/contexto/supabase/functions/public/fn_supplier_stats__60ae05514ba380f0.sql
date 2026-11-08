CREATE OR REPLACE FUNCTION public.fn_supplier_stats(p_supplier_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'fornecedor', co.nome_crm,
    'cnpj', co.cnpj,
    'homologado', s.homologado,
    'data_homologacao', s.data_homologacao,
    'homologacao', (
      SELECT json_build_object(
        'status', sh.status,
        'validade', sh.validade,
        'dias_restantes', CASE WHEN sh.validade IS NOT NULL THEN sh.validade - CURRENT_DATE ELSE NULL END,
        'avaliador', (SELECT name FROM users WHERE id = sh.avaliador_id)
      )
      FROM supplier_homologations sh WHERE sh.supplier_id = s.id ORDER BY sh.created_at DESC LIMIT 1
    ),
    'score', (
      SELECT json_build_object(
        'geral', ss.score_geral,
        'preco', ss.score_preco,
        'prazo', ss.score_prazo,
        'qualidade', ss.score_qualidade,
        'entrega', ss.score_entrega,
        'classificacao', ss.classificacao,
        'trend', ss.trend,
        'total_avaliacoes', ss.total_avaliacoes,
        'ultima_avaliacao', ss.ultima_avaliacao
      )
      FROM supplier_scores ss WHERE ss.supplier_id = s.id
    ),
    'ultimas_avaliacoes', (
      SELECT COALESCE(json_agg(json_build_object(
        'data', se.data_avaliacao,
        'referencia', se.referencia,
        'nota_geral', se.nota_geral,
        'avaliador', (SELECT name FROM users WHERE id = se.avaliador_id),
        'comentario', se.comentario
      ) ORDER BY se.data_avaliacao DESC), '[]'::json)
      FROM (SELECT * FROM supplier_evaluations WHERE supplier_id = s.id ORDER BY data_avaliacao DESC LIMIT 5) se
    ),
    'historico_score', (
      SELECT COALESCE(json_agg(json_build_object(
        'data', ssh.measured_at,
        'score', ssh.score_geral,
        'mudanca', ssh.score_change,
        'segmento', ssh.segment_code,
        'trend', ssh.trend
      ) ORDER BY ssh.measured_at DESC), '[]'::json)
      FROM (SELECT * FROM supplier_score_history WHERE supplier_id = s.id ORDER BY measured_at DESC LIMIT 10) ssh
    )
  ) INTO v_result
  FROM suppliers s
  JOIN companies co ON co.id = s.company_id
  WHERE s.id = p_supplier_id;

  IF v_result IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Fornecedor não encontrado');
  END IF;

  RETURN v_result;
END;
$function$
