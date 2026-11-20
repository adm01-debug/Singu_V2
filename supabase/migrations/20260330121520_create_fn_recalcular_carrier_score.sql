-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121520
-- nome:   create_fn_recalcular_carrier_score

CREATE OR REPLACE FUNCTION fn_recalcular_carrier_score(p_carrier_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_peso_pontualidade NUMERIC;
  v_peso_conservacao NUMERIC;
  v_peso_preco_frete NUMERIC;
  v_peso_cobertura NUMERIC;
  v_peso_rastreamento NUMERIC;
  v_soma_pesos NUMERIC;
  v_avg_pontualidade NUMERIC;
  v_avg_conservacao NUMERIC;
  v_avg_preco_frete NUMERIC;
  v_avg_cobertura NUMERIC;
  v_avg_rastreamento NUMERIC;
  v_score_geral NUMERIC;
  v_total INTEGER;
  v_ultima DATE;
  v_prev_score NUMERIC;
  v_prev_segment TEXT;
  v_new_segment TEXT;
  v_new_classificacao TEXT;
  v_trend TEXT;
BEGIN
  -- Buscar pesos de config_regras_negocio
  SELECT valor::numeric INTO v_peso_pontualidade FROM config_regras_negocio WHERE chave = 'CARRIER_PESO_PONTUALIDADE';
  SELECT valor::numeric INTO v_peso_conservacao FROM config_regras_negocio WHERE chave = 'CARRIER_PESO_CONSERVACAO';
  SELECT valor::numeric INTO v_peso_preco_frete FROM config_regras_negocio WHERE chave = 'CARRIER_PESO_PRECO_FRETE';
  SELECT valor::numeric INTO v_peso_cobertura FROM config_regras_negocio WHERE chave = 'CARRIER_PESO_COBERTURA';
  SELECT valor::numeric INTO v_peso_rastreamento FROM config_regras_negocio WHERE chave = 'CARRIER_PESO_RASTREAMENTO';

  -- Normalizar pela soma real dos pesos (evita score > 100)
  v_soma_pesos := v_peso_pontualidade + v_peso_conservacao + v_peso_preco_frete + v_peso_cobertura + v_peso_rastreamento;
  IF v_soma_pesos = 0 THEN v_soma_pesos := 100; END IF;

  -- Calcular médias (notas 1-5 → convertidas para 0-100 multiplicando por 20)
  SELECT 
    COALESCE(AVG(nota_pontualidade), 0) * 20,
    COALESCE(AVG(nota_conservacao), 0) * 20,
    COALESCE(AVG(nota_preco_frete), 0) * 20,
    COALESCE(AVG(nota_cobertura), 0) * 20,
    COALESCE(AVG(nota_rastreamento), 0) * 20,
    COUNT(*),
    MAX(data_avaliacao)
  INTO v_avg_pontualidade, v_avg_conservacao, v_avg_preco_frete, v_avg_cobertura, v_avg_rastreamento, v_total, v_ultima
  FROM carrier_evaluations
  WHERE carrier_id = p_carrier_id;

  IF v_total = 0 THEN RETURN; END IF;

  -- Score ponderado NORMALIZADO (sempre 0-100)
  v_score_geral := ROUND(
    (v_avg_pontualidade * v_peso_pontualidade + v_avg_conservacao * v_peso_conservacao + 
     v_avg_preco_frete * v_peso_preco_frete + v_avg_cobertura * v_peso_cobertura +
     v_avg_rastreamento * v_peso_rastreamento) / v_soma_pesos, 2
  );

  -- Clamp: nunca abaixo de 0 ou acima de 100
  v_score_geral := GREATEST(0, LEAST(100, v_score_geral));

  -- Score anterior
  SELECT score_geral, segment_code INTO v_prev_score, v_prev_segment
  FROM carrier_scores WHERE carrier_id = p_carrier_id;

  -- Determinar segmento via carrier_qualification_config
  SELECT segment_code, name_pt INTO v_new_segment, v_new_classificacao
  FROM carrier_qualification_config
  WHERE is_active = true AND v_score_geral BETWEEN score_min AND score_max
  ORDER BY priority LIMIT 1;

  -- Trend
  IF v_prev_score IS NULL THEN v_trend := 'estavel';
  ELSIF v_score_geral > v_prev_score + 2 THEN v_trend := 'melhorando';
  ELSIF v_score_geral < v_prev_score - 2 THEN v_trend := 'piorando';
  ELSE v_trend := 'estavel';
  END IF;

  -- Upsert carrier_scores
  INSERT INTO carrier_scores (carrier_id, score_pontualidade, score_conservacao, score_preco_frete,
    score_rastreamento, score_cobertura, score_geral, previous_score, score_change, 
    segment_code, classificacao, total_avaliacoes, ultima_avaliacao, trend, calculated_at)
  VALUES (p_carrier_id, ROUND(v_avg_pontualidade,2), ROUND(v_avg_conservacao,2), ROUND(v_avg_preco_frete,2),
    ROUND(v_avg_rastreamento,2), ROUND(v_avg_cobertura,2), v_score_geral, v_prev_score, 
    ROUND(COALESCE(v_score_geral - v_prev_score, 0),2),
    v_new_segment, v_new_classificacao, v_total, v_ultima, v_trend, NOW())
  ON CONFLICT (carrier_id) DO UPDATE SET
    score_pontualidade = EXCLUDED.score_pontualidade,
    score_conservacao = EXCLUDED.score_conservacao,
    score_preco_frete = EXCLUDED.score_preco_frete,
    score_rastreamento = EXCLUDED.score_rastreamento,
    score_cobertura = EXCLUDED.score_cobertura,
    score_geral = EXCLUDED.score_geral,
    previous_score = EXCLUDED.previous_score,
    score_change = EXCLUDED.score_change,
    segment_code = EXCLUDED.segment_code,
    classificacao = EXCLUDED.classificacao,
    total_avaliacoes = EXCLUDED.total_avaliacoes,
    ultima_avaliacao = EXCLUDED.ultima_avaliacao,
    trend = EXCLUDED.trend,
    calculated_at = NOW();

  -- Atualizar cache em carriers
  UPDATE carriers SET score_geral = v_score_geral WHERE id = p_carrier_id;

  -- Registrar histórico
  INSERT INTO carrier_score_history (carrier_id, score_pontualidade, score_conservacao, score_preco_frete,
    score_rastreamento, score_cobertura, score_geral, previous_score, score_change, 
    segment_code, previous_segment, segment_changed, trend, change_reason)
  VALUES (p_carrier_id, ROUND(v_avg_pontualidade,2), ROUND(v_avg_conservacao,2), ROUND(v_avg_preco_frete,2),
    ROUND(v_avg_rastreamento,2), ROUND(v_avg_cobertura,2), v_score_geral, v_prev_score, 
    ROUND(COALESCE(v_score_geral - v_prev_score, 0),2),
    v_new_segment, v_prev_segment, v_new_segment IS DISTINCT FROM v_prev_segment,
    v_trend, 'Recálculo após avaliação');
END;
$function$;

COMMENT ON FUNCTION fn_recalcular_carrier_score(uuid) IS 'Motor de cálculo do score de transportadora. Normaliza pesos, converte notas 1-5 para 0-100, clamp, upsert scores, registra histórico.';
