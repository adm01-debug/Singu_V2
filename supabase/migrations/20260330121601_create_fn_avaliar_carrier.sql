-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121601
-- nome:   create_fn_avaliar_carrier

CREATE OR REPLACE FUNCTION fn_avaliar_carrier(
  p_carrier_id uuid,
  p_avaliador_id integer,
  p_nota_pontualidade integer,
  p_nota_conservacao integer,
  p_nota_preco_frete integer,
  p_nota_rastreamento integer,
  p_nota_cobertura integer,
  p_referencia text DEFAULT NULL,
  p_comentario text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_eval_id UUID;
  v_score_geral NUMERIC;
  v_classificacao TEXT;
  v_homologado BOOLEAN;
  v_warning TEXT := NULL;
BEGIN
  -- Validação: carrier existe?
  IF NOT EXISTS(SELECT 1 FROM carriers WHERE id = p_carrier_id) THEN
    RETURN json_build_object('success', false, 'error', 'Transportadora não encontrada');
  END IF;

  -- Validação: avaliador ativo?
  IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_avaliador_id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Avaliador não encontrado ou inativo');
  END IF;

  -- Validação: notas entre 1 e 5
  IF p_nota_pontualidade NOT BETWEEN 1 AND 5 OR p_nota_conservacao NOT BETWEEN 1 AND 5 
     OR p_nota_preco_frete NOT BETWEEN 1 AND 5 OR p_nota_rastreamento NOT BETWEEN 1 AND 5
     OR p_nota_cobertura NOT BETWEEN 1 AND 5 THEN
    RETURN json_build_object('success', false, 'error', 'Todas as notas devem ser entre 1 e 5');
  END IF;

  -- CHECK: homologação (warning, não bloqueio)
  SELECT c.homologado INTO v_homologado FROM carriers c WHERE c.id = p_carrier_id;
  IF v_homologado = false THEN
    v_warning := 'ATENÇÃO: Transportadora NÃO está homologada! Avaliação registrada, mas a transportadora precisa ser homologada pela Logística antes de novos envios.';
  END IF;

  -- Inserir avaliação (trigger recalcula score automaticamente)
  INSERT INTO carrier_evaluations (carrier_id, avaliador_id, referencia, 
    nota_pontualidade, nota_conservacao, nota_preco_frete, nota_rastreamento, nota_cobertura, comentario)
  VALUES (p_carrier_id, p_avaliador_id, p_referencia, 
    p_nota_pontualidade, p_nota_conservacao, p_nota_preco_frete, p_nota_rastreamento, p_nota_cobertura, p_comentario)
  RETURNING id INTO v_eval_id;

  -- Buscar score recalculado
  SELECT cs.score_geral, cs.classificacao INTO v_score_geral, v_classificacao
  FROM carrier_scores cs WHERE cs.carrier_id = p_carrier_id;

  RETURN json_build_object(
    'success', true,
    'evaluation_id', v_eval_id,
    'carrier_id', p_carrier_id,
    'nota_geral_avaliacao', ROUND((p_nota_pontualidade + p_nota_conservacao + p_nota_preco_frete + p_nota_rastreamento + p_nota_cobertura)::numeric / 5.0, 2),
    'score_consolidado', v_score_geral,
    'classificacao', v_classificacao,
    'homologado', v_homologado,
    'warning', v_warning
  );
END;
$function$;

COMMENT ON FUNCTION fn_avaliar_carrier(uuid, integer, integer, integer, integer, integer, integer, text, text) IS 'Registra avaliação de transportadora (5 critérios, notas 1-5). Emite warning se não homologada. Trigger recalcula score.';
