-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409222447
-- nome:   zapp_history_198_full_intelligence_report

CREATE OR REPLACE FUNCTION zapp_history.get_full_intelligence_report(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_msg RECORD;
  v_contact RECORD;
  v_company RECORD;
  v_playbook zapp_history.disc_playbook%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','message not found'); END IF;

  SELECT * INTO v_contact FROM public.contacts WHERE id = v_msg.contact_id;
  SELECT * INTO v_company FROM public.companies WHERE id = v_msg.company_id;

  IF v_msg.disc_profile IS NOT NULL THEN
    SELECT * INTO v_playbook FROM zapp_history.disc_playbook WHERE profile = v_msg.disc_profile->>'profile';
  END IF;

  v_result := jsonb_build_object(
    'message_id', v_msg.id,
    'recebido_em', v_msg.created_at,
    'preview', LEFT(v_msg.content, 200),

    -- IDENTIDADE
    'identidade', jsonb_build_object(
      'contato', v_contact.full_name,
      'whatsapp', v_msg.whatsapp_message_id,
      'empresa', v_company.razao_social,
      'cnpj', v_company.cnpj,
      'porte_empresa', v_msg.company_size,
      'tipo_cliente', v_msg.customer_type,
      'papel_interlocutor', v_msg.speaker_role,
      'idioma', v_msg.language_info,
      'localizacao', v_msg.location_extracted,
      'contatos_adicionais', v_msg.contact_info_extracted
    ),

    -- INTERESSE COMERCIAL
    'interesse', jsonb_build_object(
      'pedido', v_msg.nlp_structured_order,
      'budget', v_msg.budget_detected,
      'evento', v_msg.event_type,
      'sazonalidade', v_msg.seasonality,
      'topicos', v_msg.topics,
      'complexidade', v_msg.order_complexity,
      'objecoes', v_msg.objections,
      'gatilhos_compra', v_msg.buying_triggers
    ),

    -- COMPORTAMENTO
    'comportamento', jsonb_build_object(
      'perfil_disc', v_msg.disc_profile,
      'tom', v_msg.communication_tone,
      'estado_emocional', v_msg.emotional_state,
      'hesitacao', v_msg.hesitation,
      'pergunta', v_msg.question_analysis,
      'sentimento_nlp', jsonb_build_object('label', v_msg.nlp_sentiment, 'score', v_msg.nlp_sentiment_score)
    ),

    -- POSIÇÃO NA JORNADA
    'jornada', jsonb_build_object(
      'origem', v_msg.discovery_channel,
      'etapa_funil', v_msg.funnel_stage,
      'jornada_marketing', v_msg.journey_stage,
      'intent', v_msg.primary_intent,
      'relacionamento', v_msg.relationship_status,
      'churn_risco', v_msg.churn_risk
    ),

    -- SCORING & PRIORIZAÇÃO
    'scoring', jsonb_build_object(
      'lead_score', v_msg.lead_score,
      'lead_classification', v_msg.lead_classification,
      'priority_quadrant', v_msg.priority_quadrant,
      'credibilidade', v_msg.credibility,
      'quarentenado', v_msg.quarantined
    ),

    -- AÇÃO RECOMENDADA
    'acao', jsonb_build_object(
      'responder_ate', v_msg.suggested_response_at,
      'urgencia', v_msg.suggested_response_label,
      'playbook_disc', CASE WHEN v_playbook.profile IS NOT NULL THEN
        jsonb_build_object(
          'abordagem', v_playbook.abordagem,
          'o_que_fazer', v_playbook.o_que_fazer,
          'o_que_evitar', v_playbook.o_que_evitar,
          'gatilhos', v_playbook.gatilhos_eficazes,
          'exemplo_resposta', v_playbook.exemplo_resposta
        )
      ELSE NULL END
    )
  );

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.get_full_intelligence_report(UUID) TO authenticated, service_role;
