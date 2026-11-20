-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260405205155
-- nome:   huggingface_improvements_m01_m40

-- Migration: HuggingFace Improvements (M01-M42)
-- 2026-04-05 — Nexus Agents Studio

-- M01/M02: Embedding Configuration per Knowledge Base
CREATE TABLE IF NOT EXISTS embedding_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  knowledge_base_id UUID,
  provider TEXT NOT NULL DEFAULT 'qwen3-embedding-8b',
  dimension INTEGER NOT NULL DEFAULT 1024,
  task TEXT NOT NULL DEFAULT 'retrieval.passage',
  reranker_model TEXT DEFAULT 'qwen3-reranker-8b',
  reranker_top_k INTEGER DEFAULT 5,
  hybrid_search BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embedding_configs_ws ON embedding_configs(workspace_id);

-- M16: RAGAS Scores Storage
CREATE TABLE IF NOT EXISTS ragas_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  agent_id UUID,
  evaluation_run_id UUID,
  query TEXT NOT NULL,
  answer TEXT NOT NULL,
  faithfulness FLOAT DEFAULT 0,
  answer_relevancy FLOAT DEFAULT 0,
  context_precision FLOAT DEFAULT 0,
  context_recall FLOAT DEFAULT 0,
  answer_correctness FLOAT DEFAULT 0,
  overall_score FLOAT DEFAULT 0,
  contexts_count INTEGER DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ragas_scores_agent ON ragas_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_ragas_scores_overall ON ragas_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_ragas_scores_ws ON ragas_scores(workspace_id);

-- M37/M38: NLP Extraction Results
CREATE TABLE IF NOT EXISTS nlp_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  source_type TEXT NOT NULL DEFAULT 'whatsapp',
  source_id TEXT,
  raw_text TEXT NOT NULL,
  entities JSONB DEFAULT '[]',
  structured_order JSONB DEFAULT '{}',
  sentiment_label TEXT,
  sentiment_score FLOAT,
  pipeline_version TEXT DEFAULT 'v2',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nlp_extractions_ws ON nlp_extractions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nlp_extractions_source ON nlp_extractions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_nlp_extractions_sentiment ON nlp_extractions(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_nlp_extractions_entities ON nlp_extractions USING GIN(entities);

-- M40: ML Guardrail Logs
CREATE TABLE IF NOT EXISTS guardrail_ml_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  agent_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('input', 'output')),
  text_preview TEXT,
  all_passed BOOLEAN NOT NULL DEFAULT true,
  blocked_layers TEXT[] DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guardrail_ml_ws ON guardrail_ml_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_guardrail_ml_blocked ON guardrail_ml_logs(all_passed) WHERE NOT all_passed;
CREATE INDEX IF NOT EXISTS idx_guardrail_ml_date ON guardrail_ml_logs(created_at DESC);

-- M10-M13: Extended Model Pricing
CREATE TABLE IF NOT EXISTS model_pricing_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_cost_per_1m FLOAT NOT NULL DEFAULT 0,
  output_cost_per_1m FLOAT NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'standard',
  capabilities TEXT[] DEFAULT '{}',
  context_window INTEGER DEFAULT 0,
  active_params TEXT,
  total_params TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model, provider)
);

INSERT INTO model_pricing_v2 (model, provider, input_cost_per_1m, output_cost_per_1m, tier, capabilities, context_window, active_params, total_params) VALUES
  ('qwen3.5-397b-a17b', 'openrouter', 0.15, 0.60, 'flagship', ARRAY['reasoning','coding','vision','agentic'], 262144, '17B', '397B'),
  ('glm-5', 'openrouter', 0.10, 0.40, 'flagship', ARRAY['reasoning','coding','agentic'], 128000, '40B', '744B'),
  ('nemotron-3-nano-30b-a3b', 'openrouter', 0.01, 0.03, 'fast', ARRAY['reasoning','agentic','tool_use'], 1000000, '3B', '30B'),
  ('youtu-llm-1.96b', 'huggingface', 0.005, 0.01, 'nano', ARRAY['agentic','routing'], 128000, '1.96B', '1.96B'),
  ('qwen3-30b-a3b', 'openrouter', 0.03, 0.12, 'premium', ARRAY['reasoning','coding','agentic'], 262144, '3B', '30B'),
  ('glm-4.7-flash', 'openrouter', 0.01, 0.04, 'fast', ARRAY['reasoning','coding','agentic'], 128000, NULL, NULL),
  ('qwen3-embedding-8b', 'huggingface', 0.02, 0, 'embedding', ARRAY['embedding','retrieval'], 32768, NULL, '8B'),
  ('qwen3-reranker-8b', 'huggingface', 0.03, 0, 'reranker', ARRAY['reranking'], 32768, NULL, '8B'),
  ('bge-m3', 'huggingface', 0.01, 0, 'embedding', ARRAY['embedding','retrieval','hybrid'], 8192, NULL, NULL),
  ('jina-embeddings-v3', 'huggingface', 0.02, 0, 'embedding', ARRAY['embedding','retrieval'], 8192, NULL, NULL),
  ('bge-reranker-v2-m3', 'huggingface', 0.01, 0, 'reranker', ARRAY['reranking','multilingual'], 8192, NULL, NULL),
  ('claude-sonnet-4-20250514', 'anthropic', 3.0, 15.0, 'flagship', ARRAY['reasoning','coding','vision','agentic'], 200000, NULL, NULL),
  ('claude-haiku-4-5-20251001', 'anthropic', 0.80, 4.0, 'fast', ARRAY['reasoning','coding','agentic'], 200000, NULL, NULL)
ON CONFLICT (model, provider) DO UPDATE SET
  input_cost_per_1m = EXCLUDED.input_cost_per_1m,
  output_cost_per_1m = EXCLUDED.output_cost_per_1m,
  tier = EXCLUDED.tier,
  capabilities = EXCLUDED.capabilities;

-- Helper function: RAGAS averages per agent
CREATE OR REPLACE FUNCTION get_ragas_avg(p_agent_id UUID)
RETURNS TABLE (
  avg_faithfulness FLOAT,
  avg_relevancy FLOAT, 
  avg_precision FLOAT,
  avg_recall FLOAT,
  avg_correctness FLOAT,
  avg_overall FLOAT,
  total_evaluations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(faithfulness)::FLOAT,
    AVG(answer_relevancy)::FLOAT,
    AVG(context_precision)::FLOAT,
    AVG(context_recall)::FLOAT,
    AVG(answer_correctness)::FLOAT,
    AVG(overall_score)::FLOAT,
    COUNT(*)
  FROM ragas_scores
  WHERE agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
