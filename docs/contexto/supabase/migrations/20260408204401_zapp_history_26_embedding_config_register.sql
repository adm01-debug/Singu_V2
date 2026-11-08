-- ============================================================================
-- MELHORIA 26: Registra a config de embedding usada pelo zapp_history
-- no catálogo embedding_configs do SINGU + helper de leitura
-- ============================================================================

INSERT INTO public.embedding_configs (
  provider, dimension, task, hybrid_search, reranker_top_k
)
SELECT 'openai-text-embedding-3-small', 1536, 'zapp_history_messages', TRUE, 20
WHERE NOT EXISTS (
  SELECT 1 FROM public.embedding_configs
  WHERE provider = 'openai-text-embedding-3-small' AND task = 'zapp_history_messages'
);

INSERT INTO public.embedding_configs (
  provider, dimension, task, hybrid_search, reranker_top_k
)
SELECT 'openai-text-embedding-3-small', 1536, 'zapp_history_summaries', TRUE, 10
WHERE NOT EXISTS (
  SELECT 1 FROM public.embedding_configs
  WHERE provider = 'openai-text-embedding-3-small' AND task = 'zapp_history_summaries'
);

-- Helper que retorna a config ativa
CREATE OR REPLACE FUNCTION zapp_history.get_embedding_config(p_task TEXT DEFAULT 'zapp_history_messages')
RETURNS JSONB
LANGUAGE sql STABLE
AS $fn$
  SELECT jsonb_build_object(
    'provider', provider,
    'dimension', dimension,
    'task', task,
    'hybrid_search', hybrid_search,
    'reranker_top_k', reranker_top_k
  )
  FROM public.embedding_configs
  WHERE task = p_task
  ORDER BY created_at DESC
  LIMIT 1;
$fn$;
