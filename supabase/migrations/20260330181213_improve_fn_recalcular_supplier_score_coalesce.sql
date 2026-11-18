-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330181213
-- nome:   improve_fn_recalcular_supplier_score_coalesce

CREATE OR REPLACE FUNCTION fn_recalcular_supplier_score(p_supplier_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_peso_preco NUMERIC;
  v_peso_prazo NUMERIC;
  v_peso_qualidade NUMERIC;
  v_peso_entrega NUMERIC;
  v_soma_pesos NUMERIC;
  v_avg_preco NUMERIC;
  v_avg_prazo NUMERIC;
  v_avg_qualidade NUMERIC;
  v_avg_entrega NUMERIC;
  v_score_geral NUMERIC;
  v_total INTEGER;
  v_ultima DATE;
  v_prev_score NUMERIC;
  v_prev_segment TEXT;
  v_new_segment TEXT;
  v_new_classificacao TEXT;
  v_trend TEXT;
BEGIN
  -- FIX O1: COALESCE protege contra config deletada (defaults = pesos originais)
  SELECT COALESCE(valor::numeric, 25) INTO v_peso_preco FROM config_regras_negocio WHERE chave = 'PESO_SCORE_PRECO';
  IF v_peso_preco IS NULL THEN v_peso_preco := 25; END IF;
  
  SELECT COALESCE(valor::numeric, 25) INTO v_peso_prazo FROM config_regras_negocio WHERE chave = 'PESO_SCORE_PRAZO';
  IF v_peso_prazo IS NULL THEN v_peso_prazo := 25; END IF;
  
  SELECT COALESCE(valor::numeric, 30) INTO v_peso_qualidade FROM config_regras_negocio WHERE chave = 'PESO_SCORE_QUALIDADE';
  IF v_peso_qualidade IS NULL THEN v_peso_qualidade := 30; END IF;
  
  SELECT COALESCE(valor::numeric, 20) INTO v_peso_entrega FROM config_regras_negocio WHERE chave = 'PESO_SCORE_ENTREGA';
  IF v_peso_entrega IS NULL THEN v_peso_entrega := 20; END IF;

  v_soma_pesos := v_peso_preco + v_peso_prazo + v_peso_qualidade + v_peso_entrega;
  IF v_soma_pesos = 0 THEN v_soma_pesos := 100; END IF;

  SELECT 
    COALESCE(AVG(nota_preco), 0) * 20,
    COALESCE(AVG(nota_prazo), 0) * 20,
    COALESCE(AVG(nota_qualidade), 0) * 20,
    COALESCE(AVG(nota_entrega), 0) * 20,
    COUNT(*),
    MAX(data_avaliacao)
  INTO v_avg_preco, v_avg_prazo, v_avg_qualidade, v_avg_entrega, v_total, v_ultima
  FROM supplier_evaluations
  WHERE supplier_id = p_supplier_id;

  IF v_total = 0 THEN RETURN; END IF;

  v_score_geral := ROUND(
    (v_avg_preco * v_peso_preco + v_avg_prazo * v_peso_prazo + 
     v_avg_qualidade * v_peso_qualidade + v_avg_entrega * v_peso_entrega) / v_soma_pesos, 2
  );

  v_score_geral := GREATEST(0, LEAST(100, v_score_geral));

  SELECT score_geral, segment_code INTO v_prev_score, v_prev_segment
  FROM supplier_scores WHERE supplier_id = p_supplier_id;

  SELECT segment_code, name_pt INTO v_new_segment, v_new_classificacao
  FROM supplier_qualification_config
  WHERE is_active = true AND v_score_geral BETWEEN score_min AND score_max
  ORDER BY priority LIMIT 1;

  IF v_prev_score IS NULL THEN v_trend := 'estavel';
  ELSIF v_score_geral > v_prev_score + 2 THEN v_trend := 'melhorando';
  ELSIF v_score_geral < v_prev_score - 2 THEN v_trend := 'piorando';
  ELSE v_trend := 'estavel';
  END IF;

  INSERT INTO supplier_scores (supplier_id, score_preco, score_prazo, score_qualidade, score_entrega,
    score_geral, previous_score, score_change, segment_code, classificacao, total_avaliacoes, 
    ultima_avaliacao, trend, calculated_at)
  VALUES (p_supplier_id, ROUND(v_avg_preco,2), ROUND(v_avg_prazo,2), ROUND(v_avg_qualidade,2), 
    ROUND(v_avg_entrega,2), v_score_geral, v_prev_score, 
    ROUND(COALESCE(v_score_geral - v_prev_score, 0),2),
    v_new_segment, v_new_classificacao, v_total, v_ultima, v_trend, NOW())
  ON CONFLICT (supplier_id) DO UPDATE SET
    score_preco = EXCLUDED.score_preco,
    score_prazo = EXCLUDED.score_prazo,
    score_qualidade = EXCLUDED.score_qualidade,
    score_entrega = EXCLUDED.score_entrega,
    score_geral = EXCLUDED.score_geral,
    previous_score = EXCLUDED.previous_score,
    score_change = EXCLUDED.score_change,
    segment_code = EXCLUDED.segment_code,
    classificacao = EXCLUDED.classificacao,
    total_avaliacoes = EXCLUDED.total_avaliacoes,
    ultima_avaliacao = EXCLUDED.ultima_avaliacao,
    trend = EXCLUDED.trend,
    calculated_at = NOW();

  UPDATE suppliers SET score_geral = v_score_geral WHERE id = p_supplier_id;

  INSERT INTO supplier_score_history (supplier_id, score_preco, score_prazo, score_qualidade, 
    score_entrega, score_geral, previous_score, score_change, segment_code, previous_segment, 
    segment_changed, trend, change_reason)
  VALUES (p_supplier_id, ROUND(v_avg_preco,2), ROUND(v_avg_prazo,2), ROUND(v_avg_qualidade,2), 
    ROUND(v_avg_entrega,2), v_score_geral, v_prev_score, 
    ROUND(COALESCE(v_score_geral - v_prev_score, 0),2),
    v_new_segment, v_prev_segment, v_new_segment IS DISTINCT FROM v_prev_segment,
    v_trend, 'Recálculo após avaliação');
END;
$function$;

COMMENT ON FUNCTION fn_recalcular_supplier_score(uuid) IS 'Motor de cálculo do score de fornecedor. FIX: COALESCE protege contra config deletada (fallback pesos originais). Normaliza, clamp 0-100, upsert, histórico.';
