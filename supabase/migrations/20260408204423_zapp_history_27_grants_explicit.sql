-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408204423
-- nome:   zapp_history_27_grants_explicit

-- ============================================================================
-- MELHORIA 27: GRANTs explícitos por role
-- - anon: ZERO acesso (privacidade total — RLS bloquearia mas defesa em camadas)
-- - authenticated: SELECT em tabelas (RLS filtra por contato), EXECUTE em RPCs
-- - service_role: tudo (bypassa RLS naturalmente)
-- ============================================================================

-- Schema usage
GRANT USAGE ON SCHEMA zapp_history TO authenticated, service_role;
REVOKE ALL ON SCHEMA zapp_history FROM anon, public;

-- REVOKE ALL primeiro pra zerar
REVOKE ALL ON ALL TABLES IN SCHEMA zapp_history FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA zapp_history FROM anon, authenticated, public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA zapp_history FROM anon, authenticated, public;

-- authenticated: SELECT nas tabelas (RLS já filtra) e INSERT/UPDATE em messages, conversations, media, audio, links
GRANT SELECT ON ALL TABLES IN SCHEMA zapp_history TO authenticated;

-- Insert/update permitido em tabelas operacionais (RLS bloqueia o que não for do user)
GRANT INSERT, UPDATE ON
  zapp_history.conversations,
  zapp_history.messages,
  zapp_history.message_media,
  zapp_history.message_audio,
  zapp_history.message_links,
  zapp_history.whatsapp_connections
TO authenticated;

-- service_role: tudo
GRANT ALL ON ALL TABLES IN SCHEMA zapp_history TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA zapp_history TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA zapp_history TO service_role;

-- authenticated: EXECUTE nas RPCs públicas
GRANT EXECUTE ON FUNCTION zapp_history.user_can_access_contact(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.get_contact_messages_for_summary(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.search_contact_messages_semantic(UUID, VECTOR(1536), INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.search_messages_hybrid(TEXT, VECTOR(1536), UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.get_contact_intelligence_v2(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.trigger_backfill_summaries(DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.get_embedding_config(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.detect_pii(TEXT) TO authenticated;

-- Default privileges para futuras tabelas/funções
ALTER DEFAULT PRIVILEGES IN SCHEMA zapp_history GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA zapp_history GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA zapp_history GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA zapp_history GRANT EXECUTE ON FUNCTIONS TO service_role;
