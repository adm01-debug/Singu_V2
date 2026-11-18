-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201038
-- nome:   zapp_history_16_get_contact_intelligence_v2

-- ============================================================================
-- MELHORIA 16: get_contact_intelligence_v2 — RPC consolidada para o frontend
-- Retorna JSON completo: visão 360 + últimos N sumários + threads + insights
-- Substitui múltiplas queries por uma única chamada
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.get_contact_intelligence_v2(
  p_contact_id UUID,
  p_summaries_limit INTEGER DEFAULT 7,
  p_messages_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
BEGIN
  -- Verifica acesso (RLS-like check explícito porque function é SECURITY DEFINER)
  IF NOT zapp_history.user_can_access_contact(p_contact_id, auth.uid())
     AND auth.role() != 'service_role'
  THEN
    RAISE EXCEPTION 'access denied to contact %', p_contact_id;
  END IF;

  SELECT jsonb_build_object(
    -- Visão 360 inteira
    'overview', (SELECT row_to_json(v.*)::jsonb FROM zapp_history.v_contact_360 v WHERE v.contact_id = p_contact_id),

    -- Últimos N sumários diários
    'recent_summaries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'date', summary_date,
        'short', summary_short,
        'message_count', message_count,
        'audio_count', audio_count,
        'media_count', media_count,
        'sentiment', sentiment_overall,
        'sentiment_score', sentiment_score,
        'mood', customer_mood,
        'topics', topics,
        'intents', intents,
        'next_steps', next_steps,
        'open_questions', open_questions,
        'pain_points', customer_pain_points,
        'conversion_signal', conversion_signal,
        'singu_signals', singu_signals
      ) ORDER BY summary_date DESC)
      FROM (
        SELECT * FROM zapp_history.conversation_daily_summaries
        WHERE contact_id = p_contact_id
        ORDER BY summary_date DESC
        LIMIT p_summaries_limit
      ) s
    ), '[]'::jsonb),

    -- Conversas ativas
    'conversations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'remote_jid', remote_jid,
        'is_group', is_group,
        'group_subject', group_subject,
        'status', status,
        'priority', priority,
        'queue', queue,
        'assigned_to', assigned_to,
        'last_message_at', last_message_at,
        'last_message_preview', last_message_preview,
        'last_message_type', last_message_type,
        'unread_count', unread_count,
        'total_messages', total_messages,
        'opened_at', opened_at,
        'first_response_time_seconds', first_response_time_seconds
      ) ORDER BY last_message_at DESC NULLS LAST)
      FROM zapp_history.conversations
      WHERE contact_id = p_contact_id
        AND status IN ('open','pending')
    ), '[]'::jsonb),

    -- Mensagens recentes (últimas N)
    'recent_messages', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'direction', m.direction,
        'message_type', m.message_type,
        'content', m.content,
        'has_media', m.has_media,
        'has_audio', m.has_audio,
        'has_links', m.has_links,
        'sentiment_score', m.sentiment_score,
        'message_intent', m.message_intent,
        'created_at', m.created_at,
        'audio_transcription', (SELECT transcription FROM zapp_history.message_audio WHERE message_id = m.id),
        'media_caption', (SELECT caption FROM zapp_history.message_media WHERE message_id = m.id LIMIT 1)
      ) ORDER BY m.created_at DESC)
      FROM (
        SELECT * FROM zapp_history.messages
        WHERE contact_id = p_contact_id
        ORDER BY created_at DESC
        LIMIT p_messages_limit
      ) m
    ), '[]'::jsonb),

    -- Stats agregadas (últimos 30 dias e total)
    'stats_30d', (
      SELECT jsonb_build_object(
        'total_messages', COUNT(*),
        'inbound', COUNT(*) FILTER (WHERE direction = 'inbound'),
        'outbound', COUNT(*) FILTER (WHERE direction = 'outbound'),
        'media', COUNT(*) FILTER (WHERE has_media = TRUE),
        'audio', COUNT(*) FILTER (WHERE has_audio = TRUE),
        'links', COUNT(*) FILTER (WHERE has_links = TRUE),
        'days_active', COUNT(DISTINCT DATE(created_at AT TIME ZONE 'America/Sao_Paulo'))
      )
      FROM zapp_history.messages
      WHERE contact_id = p_contact_id
        AND created_at > NOW() - INTERVAL '30 days'
    ),

    'generated_at', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.get_contact_intelligence_v2(UUID, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION zapp_history.get_contact_intelligence_v2 IS
  'RPC consolidada para tela de detalhe do contato. Retorna overview + sumários recentes + conversas ativas + mensagens recentes + stats em 1 chamada.';
