-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408204508
-- nome:   zapp_history_28_column_comments

-- ============================================================================
-- MELHORIA 28: Documentação inline (COMMENTS) em colunas críticas
-- ============================================================================

-- whatsapp_connections
COMMENT ON COLUMN zapp_history.whatsapp_connections.instance_name IS 'Nome único da instância na Evolution API. Usado nas chamadas REST para baixar mídia/áudio.';
COMMENT ON COLUMN zapp_history.whatsapp_connections.status IS 'connected | disconnected | qr_pending | error | banned';
COMMENT ON COLUMN zapp_history.whatsapp_connections.owner_user_id IS 'Profile responsável pela instância. Recebe alertas de queda.';

-- conversations
COMMENT ON COLUMN zapp_history.conversations.remote_jid IS 'JID do WhatsApp (ex: 5511999999999@s.whatsapp.net ou xxx@g.us para grupos).';
COMMENT ON COLUMN zapp_history.conversations.last_message_at IS 'Atualizado automaticamente pelo trigger trg_bump_conversation_on_message.';
COMMENT ON COLUMN zapp_history.conversations.unread_count IS 'Incrementado em mensagens inbound. Front zera quando lê. Não decrementado por trigger.';
COMMENT ON COLUMN zapp_history.conversations.status IS 'open | pending | resolved | archived | spam';

-- messages
COMMENT ON COLUMN zapp_history.messages.whatsapp_message_id IS 'ID original do WhatsApp. UNIQUE para dedupe — webhook reentrante não duplica.';
COMMENT ON COLUMN zapp_history.messages.direction IS 'inbound = vindo do contato | outbound = enviado pelo agente | system = mensagem do sistema';
COMMENT ON COLUMN zapp_history.messages.from_me IS 'Espelho de direction (compatibilidade com clientes WhatsApp).';
COMMENT ON COLUMN zapp_history.messages.has_media IS 'TRUE quando existe row em message_media. Atualizado automaticamente pelo trigger trg_mm_set_flag.';
COMMENT ON COLUMN zapp_history.messages.has_audio IS 'TRUE quando existe row em message_audio. Atualizado automaticamente pelo trigger trg_ma_set_flag.';
COMMENT ON COLUMN zapp_history.messages.has_links IS 'TRUE quando existe row em message_links. Atualizado automaticamente pelo trigger trg_ml_increment.';
COMMENT ON COLUMN zapp_history.messages.embedding_status IS 'pending → processing → done | failed | skipped. Cron embed-message processa pending.';
COMMENT ON COLUMN zapp_history.messages.raw_payload IS 'Payload completo da Evolution API para debug e replay.';

-- message_media
COMMENT ON COLUMN zapp_history.message_media.storage_path IS 'Path no bucket: contacts/{contact_id}/{YYYY}/{MM}/{type}/{message_id}_{uuid}.{ext}';
COMMENT ON COLUMN zapp_history.message_media.hash_sha256 IS 'SHA256 do binário. Usado para dedupe entre conversas (mesmo arquivo enviado para múltiplos contatos).';
COMMENT ON COLUMN zapp_history.message_media.download_status IS 'pending → downloading → downloaded | failed | expired';
COMMENT ON COLUMN zapp_history.message_media.download_attempts IS 'Cresce em cada tentativa. Vira expired em attempts >= 5.';

-- message_audio
COMMENT ON COLUMN zapp_history.message_audio.transcription_word_timestamps IS 'Array JSONB [{word, start, end, confidence}] vindo do Whisper verbose_json. Permite alinhamento palavra-tempo.';
COMMENT ON COLUMN zapp_history.message_audio.is_training_eligible IS 'TRUE = áudio pode ir para o dataset de treino. Falso quando contém PII ou confidence < 0.5.';
COMMENT ON COLUMN zapp_history.message_audio.training_excluded_reason IS 'Motivo da exclusão: contains_pii | low_confidence | low_audio_quality | off_topic | manual';
COMMENT ON COLUMN zapp_history.message_audio.embedding IS 'Vector(1536) do text-embedding-3-small aplicado sobre a transcrição. Habilita busca semântica em áudios.';
COMMENT ON COLUMN zapp_history.message_audio.speaker IS 'contact = cliente falou | agent = atendente falou | system';

-- message_links
COMMENT ON COLUMN zapp_history.message_links.url_normalized IS 'URL canonicalizada (lowercase host, sem utm_*, sem fragment). Usada para dedupe.';
COMMENT ON COLUMN zapp_history.message_links.url_hash IS 'SHA256 da url_normalized para índice de dedupe rápido.';
COMMENT ON COLUMN zapp_history.message_links.fetch_status IS 'pending → fetching → done | failed | skipped | blocked';
COMMENT ON COLUMN zapp_history.message_links.is_safe IS 'NULL = não verificado. TRUE/FALSE após verificação de safe browsing.';

-- conversation_daily_summaries
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.summary_date IS 'Data do dia civil sumarizado (timezone America/Sao_Paulo). Junto com contact_id forma a UNIQUE.';
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.singu_signals IS 'JSONB com sinais para alimentar SINGU: {disc_hints, eq_hints, bias_hints, objections_hints}.';
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.conversion_signal IS 'high_intent | ready_to_buy | objection_raised | cooling_off | NULL';
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.synced_to_interactions IS 'Atualizado pelo trigger trg_auto_sync_summary após criar registro em public.interactions.';
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.interaction_id IS 'FK para a interaction criada no SINGU. Usado para join nos módulos DISC/EQ/vieses.';
COMMENT ON COLUMN zapp_history.conversation_daily_summaries.generation_cost_cents IS 'Custo em centavos USD da chamada OpenAI que gerou este sumário. Auditoria de custo.';

-- message_embeddings
COMMENT ON COLUMN zapp_history.message_embeddings.content_type IS 'message = texto da mensagem | audio_transcription = transcrição de áudio | caption = legenda de mídia | ocr = texto extraído de imagem';
COMMENT ON COLUMN zapp_history.message_embeddings.dimensions IS 'Sempre 1536 para text-embedding-3-small. Mudar de modelo requer recriar coluna.';

-- ai_training_dataset
COMMENT ON COLUMN zapp_history.ai_training_dataset.source_type IS 'message_pair = pergunta cliente → resposta agente | audio_transcription | summary | conversation_excerpt';
COMMENT ON COLUMN zapp_history.ai_training_dataset.contains_pii IS 'TRUE = detectada PII via ai.detect_pii. Bloqueia used_in_training até revisão humana.';
COMMENT ON COLUMN zapp_history.ai_training_dataset.pii_redacted_text IS 'Versão do input_text com [CPF], [EMAIL], [PHONE] etc substituídos.';
COMMENT ON COLUMN zapp_history.ai_training_dataset.quality_score IS '1-5. Apenas score >= 4 e reviewed=TRUE entram no fine-tuning.';

-- ai_cost_log
COMMENT ON COLUMN zapp_history.ai_cost_log.cost_cents IS 'Centavos USD. Multiplicar por 0.01 para USD.';
COMMENT ON COLUMN zapp_history.ai_cost_log.reference_type IS 'summary | message | audio — qual tipo de entidade gerou este custo.';
