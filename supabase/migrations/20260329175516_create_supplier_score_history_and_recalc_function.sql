-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329175516
-- nome:   create_supplier_score_history_and_recalc_function

-- Tabela: Histórico de score (padrão relationship_score_history)
CREATE TABLE supplier_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  score_preco NUMERIC(5,2),
  score_prazo NUMERIC(5,2),
  score_qualidade NUMERIC(5,2),
  score_entrega NUMERIC(5,2),
  score_geral NUMERIC(5,2),
  previous_score NUMERIC(5,2),
  score_change NUMERIC(5,2),
  segment_code TEXT,
  previous_segment TEXT,
  segment_changed BOOLEAN DEFAULT false,
  trend TEXT,
  change_reason TEXT,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_score_history_supplier ON supplier_score_history(supplier_id, measured_at DESC);

ALTER TABLE supplier_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ssh_select" ON supplier_score_history FOR SELECT USING (true);
CREATE POLICY "ssh_insert" ON supplier_score_history FOR INSERT WITH CHECK (true);

-- Function: Recalcular score de um fornecedor
CREATE OR REPLACE FUNCTION fn_recalcular_supplier_score(p_supplier_id UUID)
RETURNS VOID AS $$
DECLARE
  v_peso_preco NUMERIC;
  v_peso_prazo NUMERIC;
  v_peso_qualidade NUMERIC;
  v_peso_entrega NUMERIC;
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
  -- Buscar pesos
  SELECT valor::numeric INTO v_peso_preco FROM config_regras_negocio WHERE chave = 'PESO_SCORE_PRECO';
  SELECT valor::numeric INTO v_peso_prazo FROM config_regras_negocio WHERE chave = 'PESO_SCORE_PRAZO';
  SELECT valor::numeric INTO v_peso_qualidade FROM config_regras_negocio WHERE chave = 'PESO_SCORE_QUALIDADE';
  SELECT valor::numeric INTO v_peso_entrega FROM config_regras_negocio WHERE chave = 'PESO_SCORE_ENTREGA';

  -- Calcular médias (notas 1-5 → convertidas para 0-100)
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

  -- Score ponderado (0-100)
  v_score_geral := ROUND(
    (v_avg_preco * v_peso_preco + v_avg_prazo * v_peso_prazo + 
     v_avg_qualidade * v_peso_qualidade + v_avg_entrega * v_peso_entrega) / 100, 2
  );

  -- Score anterior
  SELECT score_geral, segment_code INTO v_prev_score, v_prev_segment
  FROM supplier_scores WHERE supplier_id = p_supplier_id;

  -- Determinar segmento
  SELECT segment_code, name_pt INTO v_new_segment, v_new_classificacao
  FROM supplier_qualification_config
  WHERE is_active = true AND v_score_geral BETWEEN score_min AND score_max
  ORDER BY priority LIMIT 1;

  -- Trend
  IF v_prev_score IS NULL THEN v_trend := 'estavel';
  ELSIF v_score_geral > v_prev_score + 2 THEN v_trend := 'melhorando';
  ELSIF v_score_geral < v_prev_score - 2 THEN v_trend := 'piorando';
  ELSE v_trend := 'estavel';
  END IF;

  -- Upsert supplier_scores
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

  -- Atualizar cache no suppliers
  UPDATE suppliers SET score_geral = v_score_geral WHERE id = p_supplier_id;

  -- Registrar histórico
  INSERT INTO supplier_score_history (supplier_id, score_preco, score_prazo, score_qualidade, 
    score_entrega, score_geral, previous_score, score_change, segment_code, previous_segment, 
    segment_changed, trend, change_reason)
  VALUES (p_supplier_id, ROUND(v_avg_preco,2), ROUND(v_avg_prazo,2), ROUND(v_avg_qualidade,2), 
    ROUND(v_avg_entrega,2), v_score_geral, v_prev_score, 
    ROUND(COALESCE(v_score_geral - v_prev_score, 0),2),
    v_new_segment, v_prev_segment, v_new_segment IS DISTINCT FROM v_prev_segment,
    v_trend, 'Recálculo após avaliação');
END;
$$ LANGUAGE plpgsql;
