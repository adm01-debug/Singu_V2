-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409210548
-- nome:   zapp_history_155_conversation_intelligence

-- RPC que retorna histórico inteligente completo de uma conversa
CREATE OR REPLACE FUNCTION zapp_history.get_conversation_intelligence(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
  v_conv RECORD;
BEGIN
  SELECT c.*, ct.full_name AS contact_name, comp.razao_social AS company_name
  INTO v_conv
  FROM zapp_history.conversations c
  JOIN public.contacts ct ON ct.id = c.contact_id
  LEFT JOIN public.companies comp ON comp.id = c.company_id
  WHERE c.id = p_conversation_id;

  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'conversation not found'); END IF;

  SELECT jsonb_build_object(
    'conversation_id', v_conv.id,
    'contato', v_conv.contact_name,
    'empresa', v_conv.company_name,
    'whatsapp', v_conv.remote_jid,
    'status', v_conv.status,
    'unread_count', v_conv.unread_count,
    'sla_status', v_conv.sla_status,
    'first_response_seconds', v_conv.first_response_seconds,
    'avg_response_seconds', v_conv.avg_response_seconds,
    'first_msg_at', v_conv.first_inbound_at,
    'last_msg_at', v_conv.last_message_at,

    -- Estatísticas agregadas
    'estatisticas', (
      SELECT jsonb_build_object(
        'total_mensagens', COUNT(*),
        'inbound', COUNT(*) FILTER (WHERE direction = 'inbound'),
        'outbound', COUNT(*) FILTER (WHERE direction = 'outbound'),
        'max_lead_score', MAX(lead_score),
        'avg_lead_score', AVG(lead_score)::numeric(5,2),
        'budget_total_mencionado', SUM(budget_detected)::numeric(14,2),
        'urgentes', COUNT(*) FILTER (WHERE nlp_sentiment = 'urgent'),
        'tem_churn_alerta', BOOL_OR(churn_risk IS NOT NULL)
      )
      FROM zapp_history.messages WHERE conversation_id = p_conversation_id
    ),

    -- Perfil consolidado (mais frequente)
    'perfil_consolidado', (
      SELECT jsonb_build_object(
        'disc_dominante', mode() WITHIN GROUP (ORDER BY disc_profile->>'profile') FILTER (WHERE disc_profile IS NOT NULL),
        'tom_predominante', mode() WITHIN GROUP (ORDER BY communication_tone->>'tone') FILTER (WHERE communication_tone IS NOT NULL),
        'tipo_cliente', mode() WITHIN GROUP (ORDER BY customer_type) FILTER (WHERE customer_type IS NOT NULL),
        'jornada_atual', (
          SELECT journey_stage FROM zapp_history.messages
          WHERE conversation_id = p_conversation_id AND journey_stage IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        ),
        'etapa_funil_atual', (
          SELECT funnel_stage FROM zapp_history.messages
          WHERE conversation_id = p_conversation_id AND funnel_stage IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        )
      )
      FROM zapp_history.messages WHERE conversation_id = p_conversation_id
    ),

    -- Tópicos mais discutidos
    'topicos_principais', (
      SELECT jsonb_agg(t.topico ORDER BY t.cnt DESC)
      FROM (
        SELECT unnest(topics) AS topico, COUNT(*) AS cnt
        FROM zapp_history.messages
        WHERE conversation_id = p_conversation_id AND topics IS NOT NULL
        GROUP BY unnest(topics)
        ORDER BY cnt DESC LIMIT 5
      ) t
    ),

    -- Produtos mencionados
    'produtos_interesse', (
      SELECT jsonb_agg(DISTINCT nlp_structured_order->>'product')
      FROM zapp_history.messages
      WHERE conversation_id = p_conversation_id
        AND nlp_structured_order ? 'product'
    ),

    -- Objeções
    'objecoes_levantadas', (
      SELECT jsonb_agg(DISTINCT obj)
      FROM zapp_history.messages, unnest(objections) AS obj
      WHERE conversation_id = p_conversation_id AND objections IS NOT NULL
    ),

    -- Gatilhos de compra
    'gatilhos_observados', (
      SELECT jsonb_agg(DISTINCT trg)
      FROM zapp_history.messages, unnest(buying_triggers) AS trg
      WHERE conversation_id = p_conversation_id AND buying_triggers IS NOT NULL
    ),

    -- Timeline (últimas 10 mensagens com tudo)
    'timeline', (
      SELECT jsonb_agg(jsonb_build_object(
        'when', created_at,
        'direction', direction,
        'intent', primary_intent,
        'sentiment', nlp_sentiment,
        'lead_score', lead_score,
        'funnel_stage', funnel_stage,
        'preview', LEFT(content, 120)
      ) ORDER BY created_at DESC)
      FROM (
        SELECT * FROM zapp_history.messages
        WHERE conversation_id = p_conversation_id
        ORDER BY created_at DESC LIMIT 10
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.get_conversation_intelligence(UUID) TO authenticated, service_role;
