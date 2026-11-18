-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408204226
-- nome:   zapp_history_23_fix_sync_type

CREATE OR REPLACE FUNCTION zapp_history.sync_summary_to_interaction(p_summary_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  s zapp_history.conversation_daily_summaries%ROWTYPE;
  v_interaction_id UUID;
BEGIN
  SELECT * INTO s FROM zapp_history.conversation_daily_summaries WHERE id = p_summary_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'summary % not found', p_summary_id; END IF;

  INSERT INTO public.interactions (
    contact_id, company_id, channel, direction, status,
    assunto, resumo, conteudo, data_interacao,
    source_system, sentiment, metadata, tags_array, key_insights,
    follow_up_required, emotion_analysis,
    type, title, content
  ) VALUES (
    s.contact_id, s.company_id, 'whatsapp', 'inbound', 'concluido',
    COALESCE(s.summary_short, 'Resumo diário WhatsApp'),
    s.summary_short,
    s.summary_text,
    s.period_end,
    'zapp_history',
    s.sentiment_overall,
    jsonb_build_object(
      'subtype', 'daily_summary',
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
    jsonb_build_object(
      'sentiment_score', s.sentiment_score,
      'customer_mood', s.customer_mood,
      'customer_pain_points', s.customer_pain_points
    ),
    'whatsapp', 
    'Resumo WhatsApp ' || s.summary_date::text,
    s.summary_text
  )
  RETURNING id INTO v_interaction_id;

  UPDATE zapp_history.conversation_daily_summaries
  SET interaction_id = v_interaction_id,
      synced_to_interactions = TRUE,
      synced_at = NOW(),
      sync_error = NULL
  WHERE id = p_summary_id;

  RETURN v_interaction_id;
EXCEPTION WHEN OTHERS THEN
  UPDATE zapp_history.conversation_daily_summaries SET sync_error = SQLERRM WHERE id = p_summary_id;
  RAISE;
END;
$fn$;
