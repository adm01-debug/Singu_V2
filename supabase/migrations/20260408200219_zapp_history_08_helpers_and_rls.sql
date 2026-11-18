-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200219
-- nome:   zapp_history_08_helpers_and_rls

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Lista mensagens do contato no dia (para sumarização diária)
CREATE OR REPLACE FUNCTION zapp_history.get_contact_messages_for_summary(
  p_contact_id UUID,
  p_date DATE,
  p_timezone TEXT DEFAULT 'America/Sao_Paulo'
)
RETURNS TABLE (
  message_id UUID,
  direction TEXT,
  content TEXT,
  audio_transcription TEXT,
  media_caption TEXT,
  links TEXT[],
  sent_at TIMESTAMPTZ,
  agent_name TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  v_start := (p_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_timezone;
  v_end := (p_date::TEXT || ' 23:59:59.999')::TIMESTAMP AT TIME ZONE p_timezone;

  RETURN QUERY
  SELECT
    m.id,
    m.direction,
    m.content,
    ma.transcription,
    mm.caption,
    ARRAY(SELECT url FROM zapp_history.message_links ml WHERE ml.message_id = m.id),
    m.created_at,
    COALESCE(p.full_name, 'sistema')
  FROM zapp_history.messages m
  LEFT JOIN zapp_history.message_audio ma ON ma.message_id = m.id
  LEFT JOIN zapp_history.message_media mm ON mm.message_id = m.id
  LEFT JOIN public.profiles p ON p.id = m.sent_by_user_id
  WHERE m.contact_id = p_contact_id
    AND m.created_at >= v_start
    AND m.created_at <= v_end
  ORDER BY m.created_at ASC;
END;
$fn$;

-- Lista contatos com atividade no dia (para batch de sumarização)
CREATE OR REPLACE FUNCTION zapp_history.get_contacts_with_activity(
  p_date DATE,
  p_timezone TEXT DEFAULT 'America/Sao_Paulo'
)
RETURNS TABLE (contact_id UUID, message_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  v_start := (p_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_timezone;
  v_end := (p_date::TEXT || ' 23:59:59.999')::TIMESTAMP AT TIME ZONE p_timezone;

  RETURN QUERY
  SELECT m.contact_id, COUNT(*)::BIGINT
  FROM zapp_history.messages m
  WHERE m.created_at >= v_start AND m.created_at <= v_end
  GROUP BY m.contact_id
  HAVING COUNT(*) > 0;
END;
$fn$;

-- Busca semântica em mensagens de um contato
CREATE OR REPLACE FUNCTION zapp_history.search_contact_messages_semantic(
  p_contact_id UUID,
  p_query_embedding VECTOR(1536),
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  content_type TEXT,
  similarity NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    me.message_id,
    me.content_text,
    me.content_type,
    (1 - (me.embedding <=> p_query_embedding))::NUMERIC AS similarity,
    m.created_at
  FROM zapp_history.message_embeddings me
  JOIN zapp_history.messages m ON m.id = me.message_id
  WHERE me.contact_id = p_contact_id
  ORDER BY me.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$fn$;

-- Sync de sumário para public.interactions (SINGU)
-- Idempotente: se já existe interaction para esse contato+dia, atualiza
CREATE OR REPLACE FUNCTION zapp_history.sync_summary_to_interaction(
  p_summary_id UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  s zapp_history.conversation_daily_summaries%ROWTYPE;
  v_interaction_id UUID;
BEGIN
  SELECT * INTO s FROM zapp_history.conversation_daily_summaries WHERE id = p_summary_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'summary % not found', p_summary_id;
  END IF;

  -- Upsert em public.interactions
  INSERT INTO public.interactions (
    contact_id, company_id, channel, direction, status,
    assunto, resumo, conteudo, data_interacao,
    source_system, sentiment, metadata, tags_array, key_insights,
    follow_up_required, follow_up_date, emotion_analysis,
    type, title, content
  ) VALUES (
    s.contact_id, s.company_id, 'whatsapp', 'mixed', 'concluido',
    COALESCE(s.summary_short, 'Resumo diário WhatsApp'),
    s.summary_short,
    s.summary_text,
    s.period_end,
    'zapp_history',
    s.sentiment_overall,
    jsonb_build_object(
      'summary_id', s.id,
      'summary_date', s.summary_date,
      'message_count', s.message_count,
      'inbound_count', s.inbound_count,
      'outbound_count', s.outbound_count,
      'media_count', s.media_count,
      'audio_count', s.audio_count,
      'link_count', s.link_count,
      'topics', s.topics,
      'intents', s.intents,
      'entities', s.entities,
      'next_steps', s.next_steps,
      'open_questions', s.open_questions,
      'conversion_signal', s.conversion_signal,
      'customer_mood', s.customer_mood,
      'singu_signals', s.singu_signals,
      'generated_by_model', s.generated_by_model
    ),
    COALESCE(s.topics, ARRAY[]::TEXT[]),
    COALESCE(s.key_points, ARRAY[]::TEXT[]),
    COALESCE(cardinality(s.next_steps) > 0, false),
    NULL,
    jsonb_build_object(
      'sentiment_score', s.sentiment_score,
      'customer_mood', s.customer_mood,
      'customer_pain_points', s.customer_pain_points
    ),
    'whatsapp_daily_summary',
    'Resumo WhatsApp ' || s.summary_date::text,
    s.summary_text
  )
  RETURNING id INTO v_interaction_id;

  -- Marca como sincronizado
  UPDATE zapp_history.conversation_daily_summaries
  SET interaction_id = v_interaction_id,
      synced_to_interactions = TRUE,
      synced_at = NOW(),
      sync_error = NULL
  WHERE id = p_summary_id;

  RETURN v_interaction_id;
EXCEPTION WHEN OTHERS THEN
  UPDATE zapp_history.conversation_daily_summaries
  SET sync_error = SQLERRM
  WHERE id = p_summary_id;
  RAISE;
END;
$fn$;

COMMENT ON FUNCTION zapp_history.sync_summary_to_interaction IS
  'Cria uma interaction em public.interactions a partir de um sumário. Alimenta SINGU (DISC/EQ/vieses) com o resumo consolidado do dia.';

-- ============================================================================
-- Row Level Security em TODAS as tabelas do schema
-- ============================================================================

ALTER TABLE zapp_history.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.message_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.message_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.message_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.message_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.conversation_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.ai_training_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.admin_grants ENABLE ROW LEVEL SECURITY;

-- whatsapp_connections: owner vê a sua; admin vê todas
CREATE POLICY wc_owner_read ON zapp_history.whatsapp_connections
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid())
  );
CREATE POLICY wc_service_all ON zapp_history.whatsapp_connections
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- conversations: acesso via user_can_access_contact
CREATE POLICY conv_read ON zapp_history.conversations
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY conv_service_all ON zapp_history.conversations
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- messages
CREATE POLICY msg_read ON zapp_history.messages
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY msg_service_all ON zapp_history.messages
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- message_media
CREATE POLICY mm_read ON zapp_history.message_media
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY mm_service_all ON zapp_history.message_media
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- message_audio
CREATE POLICY ma_read ON zapp_history.message_audio
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY ma_service_all ON zapp_history.message_audio
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- message_links
CREATE POLICY ml_read ON zapp_history.message_links
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY ml_service_all ON zapp_history.message_links
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- message_embeddings
CREATE POLICY me_read ON zapp_history.message_embeddings
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY me_service_all ON zapp_history.message_embeddings
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- conversation_daily_summaries
CREATE POLICY cds_read ON zapp_history.conversation_daily_summaries
  FOR SELECT USING (zapp_history.user_can_access_contact(contact_id));
CREATE POLICY cds_service_all ON zapp_history.conversation_daily_summaries
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ai_training_dataset: apenas admins + service_role (pode conter PII)
CREATE POLICY atd_admin_read ON zapp_history.ai_training_dataset
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid())
  );
CREATE POLICY atd_service_all ON zapp_history.ai_training_dataset
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- admin_grants: só service_role escreve; admins existentes podem ler
CREATE POLICY ag_admin_read ON zapp_history.admin_grants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid())
  );
CREATE POLICY ag_service_all ON zapp_history.admin_grants
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
