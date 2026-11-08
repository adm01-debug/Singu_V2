CREATE OR REPLACE FUNCTION zapp_history.get_embedding_config(p_task text DEFAULT 'zapp_history_messages'::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
