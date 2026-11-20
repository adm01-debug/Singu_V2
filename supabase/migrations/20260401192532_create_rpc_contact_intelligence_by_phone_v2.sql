-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260401192532
-- nome:   create_rpc_contact_intelligence_by_phone_v2

CREATE OR REPLACE FUNCTION public.get_contact_intelligence_by_phone(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_clean TEXT;
  v_contact_id UUID;
  v_company_id UUID;
  v_contact RECORD;
  v_company RECORD;
  v_customer RECORD;
  v_rfm RECORD;
  v_result JSONB := '{}'::JSONB;
  v_briefing JSONB;
  v_triggers JSONB;
  v_rapport JSONB;
  v_best_times JSONB;
  v_churn JSONB;
  v_disc_tips JSONB;
  v_last_interactions JSONB;
  v_days_since_last INT;
  v_interaction_count INT;
BEGIN
  v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF length(v_clean) >= 12 AND v_clean LIKE '55%' THEN
    v_clean := substring(v_clean FROM 3);
  END IF;

  SELECT cp.contact_id INTO v_contact_id
  FROM contact_phones cp
  WHERE cp.numero_normalizado = v_clean OR cp.numero_e164 = '+55' || v_clean OR cp.numero = v_clean
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'phone', p_phone);
  END IF;

  SELECT * INTO v_contact FROM contacts WHERE id = v_contact_id;
  v_company_id := v_contact.company_id;

  IF v_company_id IS NOT NULL THEN
    SELECT * INTO v_company FROM companies WHERE id = v_company_id;
    SELECT * INTO v_customer FROM customers WHERE company_id = v_company_id AND deleted_at IS NULL LIMIT 1;
    SELECT * INTO v_rfm FROM company_rfm_scores WHERE company_id = v_company_id ORDER BY calculated_at DESC LIMIT 1;
  END IF;

  SELECT 
    EXTRACT(DAY FROM NOW() - MAX(data_interacao))::INT,
    COUNT(*)::INT
  INTO v_days_since_last, v_interaction_count
  FROM interactions WHERE contact_id = v_contact_id;

  -- BRIEFING
  v_briefing := jsonb_build_object(
    'contact_name', COALESCE(v_contact.nome_tratamento, v_contact.full_name, v_contact.first_name),
    'company_name', COALESCE(v_company.nome_fantasia, v_company.nome_crm),
    'cargo', v_contact.cargo,
    'relationship_stage', v_contact.relationship_stage,
    'relationship_score', v_contact.relationship_score,
    'sentiment', v_contact.sentiment,
    'days_since_last_contact', v_days_since_last,
    'total_interactions', v_interaction_count,
    'cliente_ativado', v_customer.cliente_ativado,
    'ja_comprou', v_customer.ja_comprou,
    'total_pedidos', COALESCE(v_customer.total_pedidos, 0),
    'valor_total_compras', COALESCE(v_customer.valor_total_compras, 0),
    'ticket_medio', v_customer.ticket_medio,
    'vendedor', v_customer.vendedor_nome,
    'rfm_segment', v_rfm.segment_code,
    'preferred_channel', COALESCE(v_contact.behavior->>'preferredChannel', 'whatsapp'),
    'opening_tip', CASE
      WHEN v_days_since_last IS NULL OR v_days_since_last > 90 THEN 'Primeiro contato ou muito tempo sem falar. Abordagem consultiva.'
      WHEN v_days_since_last > 30 THEN 'Mais de 1 mês sem contato. Retome com novidades relevantes.'
      WHEN v_days_since_last > 7 THEN 'Contato recente. Dê continuidade ao último assunto.'
      ELSE 'Contato muito recente. Seja objetivo e direto.'
    END,
    'risk_alert', CASE
      WHEN v_customer.cliente_ativado = false THEN 'Cliente INATIVO. Verificar motivo.'
      WHEN v_rfm.segment_code IN ('At Risk', 'Hibernating', 'Lost') THEN 'Segmento RFM de risco: ' || v_rfm.segment_code
      WHEN v_days_since_last > 60 THEN 'Mais de 60 dias sem interação.'
      ELSE NULL
    END
  );

  -- TRIGGERS
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'trigger_name', tt.name_pt,
    'description', tt.description_pt,
    'category', tt.category,
    'examples', tt.examples_pt,
    'intensity', tt.default_intensity
  ) ORDER BY tt.sort_order), '[]'::JSONB)
  INTO v_triggers
  FROM (
    SELECT * FROM trigger_types 
    WHERE is_active = true
      AND (v_contact.behavior->>'discProfile' IS NULL 
        OR NOT (avoid_for_disc @> ARRAY[v_contact.behavior->>'discProfile']))
    ORDER BY sort_order LIMIT 6
  ) tt;

  -- RAPPORT
  v_rapport := jsonb_build_object(
    'hobbies', v_contact.hobbies,
    'interests', v_contact.interests_array,
    'family_info', v_contact.family_info,
    'personal_notes', v_contact.personal_notes,
    'nome_tratamento', v_contact.nome_tratamento,
    'apelido', v_contact.apelido,
    'data_nascimento', v_contact.data_nascimento,
    'suggestions', (
      SELECT COALESCE(jsonb_agg(suggestion), '[]'::JSONB)
      FROM (
        SELECT 'Chamar de ' || v_contact.nome_tratamento AS suggestion
        WHERE v_contact.nome_tratamento IS NOT NULL
        UNION ALL
        SELECT 'Aniversário: ' || to_char(v_contact.data_nascimento, 'DD/MM')
        WHERE v_contact.data_nascimento IS NOT NULL
          AND EXTRACT(DOY FROM v_contact.data_nascimento) BETWEEN EXTRACT(DOY FROM NOW()) AND EXTRACT(DOY FROM NOW()) + 30
        UNION ALL
        SELECT 'Interesses: ' || array_to_string(v_contact.interests_array, ', ')
        WHERE v_contact.interests_array IS NOT NULL AND array_length(v_contact.interests_array, 1) > 0
        UNION ALL
        SELECT 'Hobbies: ' || array_to_string(v_contact.hobbies, ', ')
        WHERE v_contact.hobbies IS NOT NULL AND array_length(v_contact.hobbies, 1) > 0
      ) s
    )
  );

  -- BEST TIMES
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day_of_week', cta.day_of_week,
    'hour', cta.hour_of_day,
    'success_rate', CASE WHEN cta.total_attempts > 0 
      THEN round((cta.success_count::numeric / cta.total_attempts) * 100) ELSE 0 END,
    'avg_response_min', cta.avg_response_time_minutes
  ) ORDER BY CASE WHEN cta.total_attempts > 0 THEN cta.success_count::numeric / cta.total_attempts ELSE 0 END DESC
  ), '[]'::JSONB)
  INTO v_best_times
  FROM contact_time_analysis cta
  WHERE cta.contact_id = v_contact_id AND cta.total_attempts > 0
  LIMIT 5;

  IF v_best_times = '[]'::JSONB THEN
    v_best_times := '[{"day_of_week":2,"hour":10,"note":"Sem dados. Sugestão: terça 10h"},{"day_of_week":4,"hour":14,"note":"Sem dados. Sugestão: quinta 14h"}]'::JSONB;
  END IF;

  -- CHURN
  SELECT jsonb_build_object(
    'churn_probability', cp.churn_probability,
    'risk_level', cp.risk_level,
    'risk_factors', cp.risk_factors,
    'recommended_actions', cp.recommended_actions
  ) INTO v_churn
  FROM churn_predictions cp
  WHERE cp.contact_id = v_contact_id AND cp.is_current = true
  ORDER BY cp.predicted_at DESC LIMIT 1;

  -- DISC TIPS
  IF v_contact.behavior->>'discProfile' IS NOT NULL THEN
    SELECT jsonb_build_object(
      'profile', dpc.profile_type,
      'name', dpc.name_pt,
      'communication_tips', dpc.communication_tips_pt,
      'sales_approach', dpc.sales_approach_pt,
      'objection_handling', dpc.objection_handling_pt,
      'closing_techniques', dpc.closing_techniques_pt,
      'keywords_to_use', dpc.keywords_to_use,
      'keywords_to_avoid', dpc.keywords_to_avoid
    ) INTO v_disc_tips
    FROM disc_profile_config dpc
    WHERE dpc.profile_type = v_contact.behavior->>'discProfile' AND dpc.is_active = true
    LIMIT 1;
  END IF;

  -- LAST 3 INTERACTIONS
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'channel', i.channel, 'assunto', i.assunto, 'resumo', i.resumo,
    'sentiment', i.sentiment, 'data', i.data_interacao
  ) ORDER BY i.data_interacao DESC), '[]'::JSONB)
  INTO v_last_interactions
  FROM (SELECT * FROM interactions WHERE contact_id = v_contact_id ORDER BY data_interacao DESC LIMIT 3) i;

  RETURN jsonb_build_object(
    'found', true,
    'contact_id', v_contact_id,
    'briefing', v_briefing,
    'triggers', v_triggers,
    'rapport', v_rapport,
    'best_times', v_best_times,
    'churn', v_churn,
    'disc_tips', v_disc_tips,
    'last_interactions', v_last_interactions
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_contact_intelligence_by_phone(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_contact_intelligence_by_phone(TEXT) TO authenticated;
