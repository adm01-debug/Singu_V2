-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201132
-- nome:   zapp_history_19_realtime_publication

-- ============================================================================
-- MELHORIA 19: Adicionar messages e conversations ao publication supabase_realtime
-- Permite que o front receba updates em tempo real (Inbox ao vivo)
-- ============================================================================

-- Garante REPLICA IDENTITY FULL (necessário pra realtime ver os campos)
ALTER TABLE zapp_history.messages REPLICA IDENTITY FULL;
ALTER TABLE zapp_history.conversations REPLICA IDENTITY FULL;
ALTER TABLE zapp_history.message_audio REPLICA IDENTITY FULL;
ALTER TABLE zapp_history.message_media REPLICA IDENTITY FULL;
ALTER TABLE zapp_history.conversation_daily_summaries REPLICA IDENTITY FULL;

-- Adiciona ao publication (se já estiver, ALTER PUBLICATION ignora)
DO $$
BEGIN
  -- messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'zapp_history'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE zapp_history.messages;
  END IF;

  -- conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'zapp_history'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE zapp_history.conversations;
  END IF;

  -- message_audio (front escuta pra atualizar quando transcrição fica pronta)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'zapp_history'
      AND tablename = 'message_audio'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE zapp_history.message_audio;
  END IF;

  -- message_media (front escuta pra atualizar quando download termina)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'zapp_history'
      AND tablename = 'message_media'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE zapp_history.message_media;
  END IF;

  -- conversation_daily_summaries (front mostra novos sumários assim que chegam)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'zapp_history'
      AND tablename = 'conversation_daily_summaries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE zapp_history.conversation_daily_summaries;
  END IF;
END$$;
