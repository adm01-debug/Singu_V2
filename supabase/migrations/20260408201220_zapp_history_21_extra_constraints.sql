-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201220
-- nome:   zapp_history_21_extra_constraints

-- ============================================================================
-- MELHORIA 21: Constraints CHECK extras para defesa em profundidade
-- ============================================================================

-- messages: word_count e link_count nunca negativos
ALTER TABLE zapp_history.messages
  DROP CONSTRAINT IF EXISTS chk_messages_word_count_positive;
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_messages_word_count_positive
  CHECK (word_count IS NULL OR word_count >= 0);

ALTER TABLE zapp_history.messages
  DROP CONSTRAINT IF EXISTS chk_messages_link_count_positive;
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_messages_link_count_positive
  CHECK (link_count >= 0);

-- messages: sentiment_score entre -1 e 1
ALTER TABLE zapp_history.messages
  DROP CONSTRAINT IF EXISTS chk_messages_sentiment_range;
ALTER TABLE zapp_history.messages
  ADD CONSTRAINT chk_messages_sentiment_range
  CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1));

-- conversations: unread_count e total_messages nunca negativos
ALTER TABLE zapp_history.conversations
  DROP CONSTRAINT IF EXISTS chk_conv_counts_positive;
ALTER TABLE zapp_history.conversations
  ADD CONSTRAINT chk_conv_counts_positive
  CHECK (unread_count >= 0 AND total_messages >= 0);

-- message_media: file_size_bytes positivo se presente
ALTER TABLE zapp_history.message_media
  DROP CONSTRAINT IF EXISTS chk_mm_file_size_positive;
ALTER TABLE zapp_history.message_media
  ADD CONSTRAINT chk_mm_file_size_positive
  CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);

ALTER TABLE zapp_history.message_media
  DROP CONSTRAINT IF EXISTS chk_mm_attempts_positive;
ALTER TABLE zapp_history.message_media
  ADD CONSTRAINT chk_mm_attempts_positive
  CHECK (download_attempts >= 0);

-- message_audio: duration positiva, attempts positivos, sentiment range
ALTER TABLE zapp_history.message_audio
  DROP CONSTRAINT IF EXISTS chk_ma_duration_positive;
ALTER TABLE zapp_history.message_audio
  ADD CONSTRAINT chk_ma_duration_positive
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

ALTER TABLE zapp_history.message_audio
  DROP CONSTRAINT IF EXISTS chk_ma_attempts_positive;
ALTER TABLE zapp_history.message_audio
  ADD CONSTRAINT chk_ma_attempts_positive
  CHECK (transcription_attempts >= 0);

ALTER TABLE zapp_history.message_audio
  DROP CONSTRAINT IF EXISTS chk_ma_confidence_range;
ALTER TABLE zapp_history.message_audio
  ADD CONSTRAINT chk_ma_confidence_range
  CHECK (transcription_confidence IS NULL OR
    (transcription_confidence >= 0 AND transcription_confidence <= 1));

ALTER TABLE zapp_history.message_audio
  DROP CONSTRAINT IF EXISTS chk_ma_sentiment_range;
ALTER TABLE zapp_history.message_audio
  ADD CONSTRAINT chk_ma_sentiment_range
  CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1));

-- conversation_daily_summaries: counts não-negativos, sentiment range, period coerente
ALTER TABLE zapp_history.conversation_daily_summaries
  DROP CONSTRAINT IF EXISTS chk_cds_counts_positive;
ALTER TABLE zapp_history.conversation_daily_summaries
  ADD CONSTRAINT chk_cds_counts_positive
  CHECK (
    message_count >= 0 AND inbound_count >= 0 AND outbound_count >= 0
    AND media_count >= 0 AND audio_count >= 0 AND link_count >= 0
  );

ALTER TABLE zapp_history.conversation_daily_summaries
  DROP CONSTRAINT IF EXISTS chk_cds_period_order;
ALTER TABLE zapp_history.conversation_daily_summaries
  ADD CONSTRAINT chk_cds_period_order
  CHECK (period_end >= period_start);

ALTER TABLE zapp_history.conversation_daily_summaries
  DROP CONSTRAINT IF EXISTS chk_cds_sentiment_range;
ALTER TABLE zapp_history.conversation_daily_summaries
  ADD CONSTRAINT chk_cds_sentiment_range
  CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1));

-- message_links: fetch_attempts positivo
ALTER TABLE zapp_history.message_links
  DROP CONSTRAINT IF EXISTS chk_ml_attempts_positive;
ALTER TABLE zapp_history.message_links
  ADD CONSTRAINT chk_ml_attempts_positive
  CHECK (fetch_attempts >= 0);
