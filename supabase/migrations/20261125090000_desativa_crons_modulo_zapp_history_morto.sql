-- O schema zapp_history é herança morta do Zapp Web: 73 relações (8 tabelas + 65 views)
-- e zero linhas em todas — conferido em messages, conversations, summaries, message_media
-- e message_embeddings. Os 5 jobs abaixo são os únicos ativos que o consomem e somam
-- ~2.900 execuções/dia sobre tabelas vazias (reconcile-nlp e reconcile-nlp-30s rodam a
-- cada minuto; 10.080 execuções cada em 7 dias). Nenhum deles toca public.whatsapp_messages,
-- que é o caminho vivo de ingestão.
--
-- Desativa sem dropar nada: tabelas, views e zapp_history.runtime_config permanecem
-- intactas — runtime_config é o que alimenta invoke_edge_function (functions_base_url,
-- EVOLUTION_URL, EVOLUTION_INSTANCE, WEBHOOK_SHARED_SECRET).
--
-- Idempotente: se o job já não existir, o WHERE não retorna linha.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'zapp-sync-pending-summaries',
  'zapp-refresh-contact-stats',
  'zapp-reconcile-nlp',
  'zapp-reconcile-nlp-30s',
  'zapp-gc-zombie-messages'
);