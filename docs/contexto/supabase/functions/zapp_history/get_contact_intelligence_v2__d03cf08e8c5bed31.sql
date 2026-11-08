CREATE OR REPLACE FUNCTION zapp_history.get_contact_intelligence_v2(p_contact_id uuid, p_summaries_limit integer DEFAULT 7, p_messages_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
