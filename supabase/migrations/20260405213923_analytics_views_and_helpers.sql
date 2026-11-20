-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260405213923
-- nome:   analytics_views_and_helpers

-- ═══════════════════════════════════════════════
-- ANALYTICS VIEWS + HELPER FUNCTIONS
-- ═══════════════════════════════════════════════

-- View: Dashboard de segurança (guardrails)
CREATE OR REPLACE VIEW v_guardrail_dashboard AS
SELECT 
  date_trunc('day', created_at) as dia,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE all_passed = true) as passed,
  COUNT(*) FILTER (WHERE all_passed = false) as blocked,
  ROUND(COUNT(*) FILTER (WHERE all_passed = false)::numeric / NULLIF(COUNT(*),0) * 100, 1) as block_rate_pct,
  array_agg(DISTINCT unnest_blocked) FILTER (WHERE unnest_blocked IS NOT NULL) as blocked_types
FROM guardrail_ml_logs,
LATERAL unnest(blocked_layers) AS unnest_blocked
GROUP BY 1
ORDER BY 1 DESC;

-- View: Qualidade RAG por agente (RAGAS scores)
CREATE OR REPLACE VIEW v_ragas_by_agent AS
SELECT 
  agent_id,
  COUNT(*) as evaluations,
  ROUND(AVG(faithfulness)::numeric, 3) as avg_faithfulness,
  ROUND(AVG(answer_relevancy)::numeric, 3) as avg_relevancy,
  ROUND(AVG(context_precision)::numeric, 3) as avg_precision,
  ROUND(AVG(context_recall)::numeric, 3) as avg_recall,
  ROUND(AVG(overall_score)::numeric, 3) as avg_overall,
  MIN(overall_score) as min_score,
  MAX(overall_score) as max_score
FROM ragas_scores
GROUP BY agent_id;

-- View: NLP extraction analytics
CREATE OR REPLACE VIEW v_nlp_analytics AS
SELECT 
  date_trunc('day', created_at) as dia,
  source_type,
  COUNT(*) as total_extractions,
  COUNT(*) FILTER (WHERE sentiment_label = 'urgent') as urgent,
  COUNT(*) FILTER (WHERE sentiment_label = 'negative') as negative,
  COUNT(*) FILTER (WHERE sentiment_label = 'positive') as positive,
  COUNT(*) FILTER (WHERE sentiment_label = 'neutral') as neutral,
  ROUND(AVG(processing_time_ms)::numeric, 0) as avg_processing_ms
FROM nlp_extractions
GROUP BY 1, 2
ORDER BY 1 DESC;

-- View: Model usage and costs
CREATE OR REPLACE VIEW v_model_catalog AS
SELECT 
  tier,
  model,
  provider,
  input_cost_per_1m as cost_input,
  output_cost_per_1m as cost_output,
  context_window,
  capabilities,
  CASE 
    WHEN input_cost_per_1m <= 0.01 THEN 'ultra-low'
    WHEN input_cost_per_1m <= 0.05 THEN 'low'
    WHEN input_cost_per_1m <= 0.20 THEN 'medium'
    WHEN input_cost_per_1m <= 1.00 THEN 'high'
    ELSE 'premium'
  END as cost_tier
FROM model_pricing_v2
ORDER BY input_cost_per_1m;

-- Function: Buscar modelo mais barato para uma capability
CREATE OR REPLACE FUNCTION find_cheapest_model(p_capability TEXT)
RETURNS TABLE (model TEXT, provider TEXT, tier TEXT, cost FLOAT, context_window INT)
AS $$
BEGIN
  RETURN QUERY
  SELECT m.model, m.provider, m.tier, m.input_cost_per_1m, m.context_window
  FROM model_pricing_v2 m
  WHERE p_capability = ANY(m.capabilities)
  ORDER BY m.input_cost_per_1m
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calcular custo estimado para N tokens
CREATE OR REPLACE FUNCTION estimate_cost(p_model TEXT, p_input_tokens INT, p_output_tokens INT)
RETURNS TABLE (model TEXT, input_cost FLOAT, output_cost FLOAT, total_cost FLOAT, total_cost_brl FLOAT)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.model,
    (m.input_cost_per_1m * p_input_tokens / 1000000.0)::FLOAT,
    (m.output_cost_per_1m * p_output_tokens / 1000000.0)::FLOAT,
    ((m.input_cost_per_1m * p_input_tokens + m.output_cost_per_1m * p_output_tokens) / 1000000.0)::FLOAT,
    ((m.input_cost_per_1m * p_input_tokens + m.output_cost_per_1m * p_output_tokens) / 1000000.0 * 5.50)::FLOAT
  FROM model_pricing_v2 m
  WHERE m.model = p_model
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
