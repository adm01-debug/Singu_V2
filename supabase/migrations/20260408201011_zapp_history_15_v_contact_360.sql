-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201011
-- nome:   zapp_history_15_v_contact_360

CREATE OR REPLACE VIEW zapp_history.v_contact_360 AS
SELECT
  c.id AS contact_id,
  c.full_name,
  c.first_name,
  c.last_name,
  c.cargo,
  c.departamento,
  c.cpf,
  c.data_nascimento,
  c.relationship_stage,
  c.relationship_score,
  c.sentiment AS contact_sentiment,
  c.tags_array AS contact_tags,
  c.behavior,
  c.notes,
  c.user_id AS owner_user_id,

  co.id AS company_id,
  co.nome_crm AS company_name,
  co.razao_social,
  co.cnpj,
  co.financial_health,

  cms.total_messages,
  cms.inbound_count,
  cms.outbound_count,
  cms.total_media,
  cms.total_audios,
  cms.total_links,
  cms.first_message_at,
  cms.last_message_at,
  cms.active_days,
  cms.total_audio_seconds,
  cms.total_summaries,
  cms.last_summary_date,
  cms.avg_sentiment_score AS whatsapp_avg_sentiment,
  cms.dominant_sentiment AS whatsapp_dominant_sentiment,

  (
    SELECT jsonb_build_object(
      'date', cds.summary_date,
      'short', cds.summary_short,
      'mood', cds.customer_mood,
      'sentiment', cds.sentiment_overall,
      'sentiment_score', cds.sentiment_score,
      'conversion_signal', cds.conversion_signal,
      'topics', cds.topics,
      'intents', cds.intents,
      'next_steps', cds.next_steps,
      'pain_points', cds.customer_pain_points
    )
    FROM zapp_history.conversation_daily_summaries cds
    WHERE cds.contact_id = c.id
    ORDER BY cds.summary_date DESC
    LIMIT 1
  ) AS latest_summary,

  (
    SELECT jsonb_build_object(
      'id', conv.id,
      'status', conv.status,
      'last_message_at', conv.last_message_at,
      'last_message_preview', conv.last_message_preview,
      'unread_count', conv.unread_count,
      'priority', conv.priority,
      'queue', conv.queue,
      'assigned_to', conv.assigned_to
    )
    FROM zapp_history.conversations conv
    WHERE conv.contact_id = c.id
    ORDER BY conv.last_message_at DESC NULLS LAST
    LIMIT 1
  ) AS latest_conversation,

  (
    SELECT jsonb_build_object(
      'primary', dah.primary_profile,
      'secondary', dah.secondary_profile,
      'blend', dah.blend_profile,
      'd_score', dah.dominance_score,
      'i_score', dah.influence_score,
      's_score', dah.steadiness_score,
      'c_score', dah.conscientiousness_score,
      'confidence', dah.confidence,
      'profile_summary', dah.profile_summary,
      'analyzed_at', dah.analyzed_at
    )
    FROM public.disc_analysis_history dah
    WHERE dah.contact_id = c.id
    ORDER BY dah.analyzed_at DESC NULLS LAST, dah.created_at DESC
    LIMIT 1
  ) AS latest_disc,

  (
    SELECT jsonb_build_object(
      'overall_score', eqh.overall_score,
      'overall_level', eqh.overall_level,
      'confidence', eqh.confidence,
      'pillars', eqh.pillar_scores,
      'strengths', eqh.strengths,
      'growth_areas', eqh.areas_for_growth,
      'analyzed_at', eqh.analyzed_at
    )
    FROM public.eq_analysis_history eqh
    WHERE eqh.contact_id = c.id
    ORDER BY eqh.analyzed_at DESC NULLS LAST, eqh.created_at DESC
    LIMIT 1
  ) AS latest_eq,

  c.created_at AS contact_created_at,
  c.updated_at AS contact_updated_at

FROM public.contacts c
LEFT JOIN public.companies co ON co.id = c.company_id
LEFT JOIN zapp_history.contact_message_stats cms ON cms.contact_id = c.id
WHERE c.deleted_at IS NULL;

COMMENT ON VIEW zapp_history.v_contact_360 IS
  'Visão 360 do contato: identidade + empresa + histórico WhatsApp + último sumário + última conversa + DISC + EQ. Single source of truth para tela de detalhe.';
