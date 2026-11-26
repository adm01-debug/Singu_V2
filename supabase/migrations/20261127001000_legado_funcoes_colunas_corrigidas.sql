-- Correção das colunas inválidas nas funções de `_dormant` reativadas.
--
-- Ao voltar as tabelas para `public` (20261127000000), sete das oito funções
-- quebradas voltaram a rodar. Três delas ainda falhavam porque foram escritas
-- contra uma geração de schema anterior à atual do Singu:
--   * `companies.title`                -> a tabela usa `nome_fantasia`/`razao_social`/`nome_crm`
--   * `objections.status`              -> a tabela usa o booleano `is_resolved`
--   * `contact_id` sem alias em `get_best_closing_moment` é ambíguo porque a
--     função devolve uma coluna com esse mesmo nome (SQLSTATE 42702).
-- Nenhuma regra de negócio muda: as consultas continuam medindo a mesma coisa
-- (nome comercial da empresa, objeções ainda não resolvidas e a tendência
-- emocional do contato).
--
-- Efeito no negócio: `vw_todays_reminders` (lembretes do dia) e
-- `vw_best_closing_moments` (melhor momento de fechamento) deixam de ficar
-- permanentemente vazias — os geradores voltam a gravar.
--
-- `suggest_triggers_for_contact` NÃO entra aqui: foi escrita para outro modelo
-- de dados (chaves uuid em `trigger_usage_log`/`contact_trigger_preferences`)
-- enquanto o schema atual usa códigos — exige reescrita de regra, não ajuste
-- de coluna.
--
-- Os três corpos abaixo são o estado final e idempotente (CREATE OR REPLACE).

-- create_smart_reminder
CREATE OR REPLACE FUNCTION public.create_smart_reminder(p_user_id uuid, p_title character varying, p_remind_at timestamp with time zone, p_contact_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_reminder_type character varying DEFAULT 'custom'::character varying, p_priority character varying DEFAULT 'normal'::character varying, p_suggested_actions text[] DEFAULT NULL::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_reminder_id UUID;
    v_context     JSONB := '{}'::JSONB;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  PERFORM public.assert_self_user_id(p_user_id);

  IF p_contact_id IS NOT NULL THEN
      SELECT jsonb_build_object(
          'contact_name',       COALESCE(c.full_name, c.first_name || ' ' || c.last_name),
          'company',            COALESCE(co.nome_fantasia, co.razao_social, co.nome_crm),
          'disc_type',          da.primary_profile,
          'last_interaction',   (SELECT MAX(data_interacao) FROM interactions WHERE contact_id = c.id),
          'relationship_score', c.relationship_score
      ) INTO v_context
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN disc_assessments da ON c.id = da.contact_id AND da.is_current = true
      WHERE c.id = p_contact_id;
  END IF;

  INSERT INTO smart_reminders (
      user_id, reminder_type, contact_id, title, description,
      remind_at, priority, context_data, suggested_actions
  ) VALUES (
      p_user_id, p_reminder_type, p_contact_id, p_title, p_description,
      p_remind_at, p_priority, v_context,
      COALESCE(p_suggested_actions, ARRAY['Fazer contato', 'Enviar mensagem', 'Agendar reunião'])
  )
  RETURNING id INTO v_reminder_id;

  RETURN v_reminder_id;
END;
$function$;

-- generate_pre_contact_briefing
CREATE OR REPLACE FUNCTION public.generate_pre_contact_briefing(p_contact_id uuid, p_contact_type character varying DEFAULT 'call'::character varying, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(briefing_id uuid, contact_name text, company_name text, disc_profile character varying, approach_tips text[], rapport_points text[], key_questions text[], anticipated_objections text[], recommended_approach text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_id        UUID;
  v_name      TEXT;
  v_company   TEXT;
  v_disc      VARCHAR(10);
  v_tips      TEXT[] := ARRAY[]::TEXT[];
  v_rapport   TEXT[] := ARRAY[]::TEXT[];
  v_questions TEXT[];
  v_objections TEXT[];
  v_approach  TEXT;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  PERFORM public.assert_self_user_id(p_user_id);

  SELECT COALESCE(c.full_name, c.first_name || ' ' || c.last_name),
         COALESCE(co.nome_fantasia, co.razao_social, co.nome_crm)
  INTO v_name, v_company
  FROM contacts c
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.id = p_contact_id;

  SELECT primary_profile INTO v_disc
  FROM disc_assessments WHERE contact_id = p_contact_id AND is_current = true;

  IF v_disc = 'D' THEN
    v_tips := ARRAY['Seja direto', 'Foque em resultados', 'Evite detalhes'];
    v_approach := 'Direto, focado em resultados.';
  ELSIF v_disc = 'I' THEN
    v_tips := ARRAY['Seja entusiasta', 'Use histórias', 'Permita que fale'];
    v_approach := 'Social e entusiasta.';
  ELSIF v_disc = 'S' THEN
    v_tips := ARRAY['Seja paciente', 'Construa confiança', 'Não pressione'];
    v_approach := 'Calma e paciente.';
  ELSIF v_disc = 'C' THEN
    v_tips := ARRAY['Traga dados', 'Seja preciso', 'Documente'];
    v_approach := 'Analítica com dados.';
  ELSE
    v_tips := ARRAY['Observe as reações', 'Adapte conforme feedback'];
    v_approach := 'Observe e adapte.';
  END IF;

  SELECT array_agg(DISTINCT si.interest_name) INTO v_rapport
  FROM shared_interests si
  WHERE si.contact_id = p_contact_id AND si.is_active = true LIMIT 5;

  IF v_rapport IS NULL THEN v_rapport := ARRAY['Pergunte sobre o dia']; END IF;

  v_questions := ARRAY[
    'Qual o principal desafio atual?',
    'O que seria ideal?',
    'Qual o timeline?',
    'Quem mais decide?'
  ];

  SELECT array_agg(DISTINCT o.objection_text) INTO v_objections
  FROM objections o
  WHERE o.contact_id = p_contact_id AND o.is_resolved IS NOT TRUE LIMIT 3;

  IF v_objections IS NULL THEN v_objections := ARRAY['Preço', 'Prazo', 'Aprovação']; END IF;

  INSERT INTO pre_contact_briefings (
      contact_id, user_id, planned_contact_type, contact_summary,
      disc_profile, disc_approach_tips, rapport_points, key_questions,
      anticipated_objections, recommended_approach, primary_objective
  ) VALUES (
      p_contact_id, p_user_id, p_contact_type,
      'Contato: ' || v_name || ' | ' || v_company,
      v_disc, v_tips, v_rapport, v_questions,
      v_objections, v_approach, 'Avançar relacionamento'
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_name, v_company, v_disc,
                      v_tips, v_rapport, v_questions, v_objections, v_approach;
END;
$function$;

-- get_best_closing_moment
CREATE OR REPLACE FUNCTION public.get_best_closing_moment(p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, recommended_timing character varying, timing_score integer, emotional_readiness integer, engagement_level integer, risk_of_losing character varying, opportunity_window_start timestamp with time zone, opportunity_window_end timestamp with time zone, recommended_approach text, key_talking_points text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_timing VARCHAR(50) := 'wait';
    v_timing_score INTEGER := 50;
    v_emotional_readiness INTEGER := 50;
    v_engagement INTEGER := 50;
    v_risk VARCHAR(20) := 'medium';
    v_window_start TIMESTAMPTZ;
    v_window_end TIMESTAMPTZ;
    v_approach TEXT;
    v_talking_points TEXT[] := ARRAY[]::TEXT[];
    v_days_since_contact INTEGER;
    v_recent_sentiment VARCHAR(20);
    v_interaction_trend VARCHAR(20);
    v_relationship_score INTEGER;
    v_objections_count INTEGER;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
    -- 1. Dias desde último contato
    SELECT EXTRACT(DAY FROM NOW() - MAX(i.created_at))::INTEGER
    INTO v_days_since_contact
    FROM interactions i WHERE i.contact_id = p_contact_id;
    
    -- 2. Sentimento recente
    SELECT sentiment INTO v_recent_sentiment
    FROM interactions i WHERE i.contact_id = p_contact_id
    ORDER BY created_at DESC LIMIT 1;
    
    -- 3. Relationship score
    SELECT COALESCE(relationship_score, 50) INTO v_relationship_score
    FROM contacts WHERE id = p_contact_id;
    
    -- 4. Objeções não resolvidas
    SELECT COUNT(*) INTO v_objections_count
    FROM objections o WHERE o.contact_id = p_contact_id AND o.is_resolved IS NOT TRUE;
    
    -- 5. Prontidão emocional
    v_emotional_readiness := CASE 
        WHEN v_recent_sentiment = 'positive' THEN 80
        WHEN v_recent_sentiment = 'neutral' THEN 50
        WHEN v_recent_sentiment = 'negative' THEN 20
        ELSE 50
    END;
    
    -- Ajustar com tendência
    SELECT trend_direction INTO v_interaction_trend
    FROM emotional_trend_snapshots ets
    WHERE ets.contact_id = p_contact_id ORDER BY ets.period_end DESC LIMIT 1;
    
    IF v_interaction_trend = 'improving' THEN
        v_emotional_readiness := LEAST(v_emotional_readiness + 15, 100);
    ELSIF v_interaction_trend = 'declining' THEN
        v_emotional_readiness := GREATEST(v_emotional_readiness - 20, 0);
    END IF;
    
    -- 6. Engajamento
    SELECT CASE 
            WHEN COUNT(*) >= 10 THEN 90
            WHEN COUNT(*) >= 5 THEN 70
            WHEN COUNT(*) >= 3 THEN 50
            ELSE 30
        END INTO v_engagement
    FROM interactions i
    WHERE i.contact_id = p_contact_id AND i.created_at > NOW() - INTERVAL '30 days';
    
    -- 7. Timing score
    v_timing_score := (
        v_emotional_readiness * 0.35 +
        v_engagement * 0.25 +
        v_relationship_score * 0.25 +
        (100 - LEAST(COALESCE(v_objections_count, 0) * 15, 50)) * 0.15
    )::INTEGER;
    
    -- 8. Timing recomendado
    v_timing := CASE 
        WHEN v_timing_score >= 80 AND COALESCE(v_objections_count, 0) = 0 THEN 'now'
        WHEN v_timing_score >= 65 THEN 'soon'
        WHEN v_timing_score >= 45 THEN 'wait'
        ELSE 'not_ready'
    END;
    
    -- 9. Risco
    v_risk := CASE 
        WHEN COALESCE(v_days_since_contact, 999) > 30 OR v_interaction_trend = 'declining' THEN 'high'
        WHEN COALESCE(v_days_since_contact, 999) > 14 OR v_emotional_readiness < 40 THEN 'medium'
        ELSE 'low'
    END;
    
    -- 10. Janela de oportunidade
    IF v_timing IN ('now', 'soon') THEN
        v_window_start := NOW();
        v_window_end := NOW() + INTERVAL '7 days';
    ELSE
        v_window_start := NOW() + INTERVAL '7 days';
        v_window_end := NOW() + INTERVAL '21 days';
    END IF;
    
    -- 11. Abordagem
    v_approach := CASE v_timing
        WHEN 'now' THEN 'Contato direto para fechamento. Cliente demonstra sinais positivos.'
        WHEN 'soon' THEN 'Preparar terreno com conteúdo de valor, propor fechamento em 3-5 dias.'
        WHEN 'wait' THEN 'Focar em construir relacionamento e resolver objeções.'
        ELSE 'Cliente não está pronto. Investir em nurturing.'
    END;
    
    -- 12. Talking points
    v_talking_points := CASE v_timing
        WHEN 'now' THEN ARRAY['Reforçar benefícios', 'Condição especial com prazo', 'Prova social']
        WHEN 'soon' THEN ARRAY['Case de sucesso', 'Timeline de decisão', 'Demonstração/trial']
        ELSE ARRAY['Entender necessidades', 'Identificar objeções', 'Mapear stakeholders']
    END;
    
    -- 13. Salvar análise
    UPDATE closing_moment_analysis SET is_current = false 
    WHERE closing_moment_analysis.contact_id = p_contact_id;
    
    INSERT INTO closing_moment_analysis (
        contact_id, recommended_timing, timing_score,
        emotional_readiness, engagement_level, risk_of_losing,
        opportunity_window_start, opportunity_window_end,
        recommended_approach, key_talking_points
    ) VALUES (
        p_contact_id, v_timing, v_timing_score,
        v_emotional_readiness, v_engagement, v_risk,
        v_window_start, v_window_end, v_approach, v_talking_points
    );
    
    RETURN QUERY SELECT 
        p_contact_id, v_timing, v_timing_score,
        v_emotional_readiness, v_engagement, v_risk,
        v_window_start, v_window_end, v_approach, v_talking_points;
END;
$function$;
