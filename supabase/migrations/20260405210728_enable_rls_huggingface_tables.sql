-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260405210728
-- nome:   enable_rls_huggingface_tables

-- Enable RLS on all 5 new HuggingFace tables
ALTER TABLE embedding_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ragas_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlp_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardrail_ml_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_pricing_v2 ENABLE ROW LEVEL SECURITY;

-- embedding_configs: Read/write for authenticated users
CREATE POLICY "embedding_configs_select" ON embedding_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "embedding_configs_insert" ON embedding_configs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "embedding_configs_update" ON embedding_configs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "embedding_configs_delete" ON embedding_configs FOR DELETE TO authenticated USING (true);

-- ragas_scores: Read for authenticated, write via service role (edge functions)
CREATE POLICY "ragas_scores_select" ON ragas_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "ragas_scores_insert" ON ragas_scores FOR INSERT TO authenticated WITH CHECK (true);

-- nlp_extractions: Read for authenticated, write via service role
CREATE POLICY "nlp_extractions_select" ON nlp_extractions FOR SELECT TO authenticated USING (true);
CREATE POLICY "nlp_extractions_insert" ON nlp_extractions FOR INSERT TO authenticated WITH CHECK (true);

-- guardrail_ml_logs: Read for authenticated (audit trail)
CREATE POLICY "guardrail_ml_logs_select" ON guardrail_ml_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "guardrail_ml_logs_insert" ON guardrail_ml_logs FOR INSERT TO authenticated WITH CHECK (true);

-- model_pricing_v2: Read-only for all authenticated (reference data)
CREATE POLICY "model_pricing_v2_select" ON model_pricing_v2 FOR SELECT TO authenticated USING (true);

-- Service role bypasses RLS for edge functions (insert/update from backend)
