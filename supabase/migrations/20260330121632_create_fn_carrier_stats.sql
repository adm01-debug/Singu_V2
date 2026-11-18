-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121632
-- nome:   create_fn_carrier_stats

CREATE OR REPLACE FUNCTION fn_carrier_stats(p_carrier_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'transportadora', co.nome_crm,
    'cnpj', co.cnpj,
    'homologado', c.homologado,
    'data_homologacao', c.data_homologacao,
    'homologacao', (
      SELECT json_build_object(
        'status', ch.status,
        'validade', ch.validade,
        'dias_restantes', CASE WHEN ch.validade IS NOT NULL THEN ch.validade - CURRENT_DATE ELSE NULL END,
        'avaliador', (SELECT name FROM users WHERE id = ch.avaliador_id)
      )
      FROM carrier_homologations ch WHERE ch.carrier_id = c.id ORDER BY ch.created_at DESC LIMIT 1
    ),
    'score', (
      SELECT json_build_object(
        'geral', cs.score_geral,
        'pontualidade', cs.score_pontualidade,
        'conservacao', cs.score_conservacao,
        'preco_frete', cs.score_preco_frete,
        'rastreamento', cs.score_rastreamento,
        'cobertura', cs.score_cobertura,
        'classificacao', cs.classificacao,
        'trend', cs.trend,
        'total_avaliacoes', cs.total_avaliacoes,
        'ultima_avaliacao', cs.ultima_avaliacao
      )
      FROM carrier_scores cs WHERE cs.carrier_id = c.id
    ),
    'ultimas_avaliacoes', (
      SELECT COALESCE(json_agg(json_build_object(
        'data', ce.data_avaliacao,
        'referencia', ce.referencia,
        'nota_geral', ce.nota_geral,
        'avaliador', (SELECT name FROM users WHERE id = ce.avaliador_id),
        'comentario', ce.comentario
      ) ORDER BY ce.data_avaliacao DESC), '[]'::json)
      FROM (SELECT * FROM carrier_evaluations WHERE carrier_id = c.id ORDER BY data_avaliacao DESC LIMIT 5) ce
    ),
    'historico_score', (
      SELECT COALESCE(json_agg(json_build_object(
        'data', csh.measured_at,
        'score', csh.score_geral,
        'mudanca', csh.score_change,
        'segmento', csh.segment_code,
        'trend', csh.trend
      ) ORDER BY csh.measured_at DESC), '[]'::json)
      FROM (SELECT * FROM carrier_score_history WHERE carrier_id = c.id ORDER BY measured_at DESC LIMIT 10) csh
    )
  ) INTO v_result
  FROM carriers c
  JOIN companies co ON co.id = c.company_id
  WHERE c.id = p_carrier_id;

  IF v_result IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Transportadora não encontrada');
  END IF;

  RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION fn_carrier_stats(uuid) IS 'JSON completo de 1 transportadora: dados, homologação, score, últimas avaliações, histórico.';
