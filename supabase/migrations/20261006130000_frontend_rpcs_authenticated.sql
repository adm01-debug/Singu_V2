-- RPCs SECURITY DEFINER chamadas pelo frontend com sessão de usuário, mas
-- executáveis só por service_role no banco canônico (42501 no app).
-- Antes de conceder EXECUTE a authenticated, cada corpo precisa amarrar o
-- escopo ao chamador (auth.uid()), porque DEFINER ignora RLS:
--   * já escopadas (só GRANT): cleanup_behavioral_regen_queue, compute_account_health,
--     compute_attribution, compute_revops_kpis, cs_renewal_pipeline, dismiss_revops_alert,
--     evaluate_mql, get_connection_metrics, publish_mtta_sla_breach_alert;
--   * reescritas com checagem de dono: enroll_contact_in_workflow (também usava a coluna
--     inexistente enrolled_count), get_marketing_funnel_stats (também lia a tabela
--     inexistente marketing_forms), get_score_explicability, move_deal_atomic,
--     seed_conversation_topics, seed_forecast_period.
-- move_deal_atomic(uuid,text,numeric) é removida: lia a coluna inexistente
-- pipeline_stage_transitions.is_allowed e tornava a chamada do PostgREST ambígua.

ALTER FUNCTION public.cleanup_behavioral_regen_queue(integer, integer, integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.publish_mtta_sla_breach_alert(integer, integer)
  SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  _id UUID;
  _inserted BOOLEAN;
BEGIN
  IF auth.uid() IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.nurturing_workflows WHERE id = _workflow_id AND user_id = auth.uid())
     OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = _contact_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.nurturing_executions (user_id, workflow_id, contact_id, status, next_action_at)
  VALUES (auth.uid(), _workflow_id, _contact_id, 'active', now())
  ON CONFLICT (workflow_id, contact_id) DO UPDATE
    SET status = 'active', next_action_at = COALESCE(public.nurturing_executions.next_action_at, now())
  RETURNING id, (xmax = 0) INTO _id, _inserted;

  IF _inserted THEN
    UPDATE public.nurturing_workflows
       SET total_enrolled = COALESCE(total_enrolled, 0) + 1
     WHERE id = _workflow_id;
  END IF;

  RETURN _id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date)
 RETURNS TABLE(stage text, count bigint, previous_stage_count bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  v_views BIGINT;
  v_leads BIGINT;
  v_mqls BIGINT;
  v_sqls BIGINT;
  v_customers BIGINT;
  v_from TIMESTAMPTZ := _start_date;
  v_to TIMESTAMPTZ := _end_date + 1;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COALESCE(SUM(view_count), 0) INTO v_views
    FROM public.lead_magnets WHERE user_id = _user_id;

  SELECT COUNT(*) INTO v_leads
    FROM public.form_submissions s
    JOIN public.forms f ON s.form_id = f.id
   WHERE f.user_id = _user_id AND s.created_at >= v_from AND s.created_at < v_to;

  SELECT COUNT(*) FILTER (WHERE m.status = 'mql' AND m.qualified_at >= v_from AND m.qualified_at < v_to),
         COUNT(*) FILTER (WHERE m.status = 'sql' AND m.handoff_at >= v_from AND m.handoff_at < v_to),
         COUNT(*) FILTER (WHERE m.status = 'customer' AND m.handoff_at >= v_from AND m.handoff_at < v_to)
    INTO v_mqls, v_sqls, v_customers
    FROM public.mql_classifications m
   WHERE m.user_id = _user_id;

  stage := 'Visualizações'; count := v_views; previous_stage_count := v_views; conversion_rate := 100;
  RETURN NEXT;
  stage := 'Leads'; count := v_leads; previous_stage_count := v_views;
  conversion_rate := CASE WHEN v_views > 0 THEN (v_leads::NUMERIC / v_views) * 100 ELSE 0 END;
  RETURN NEXT;
  stage := 'MQLs'; count := v_mqls; previous_stage_count := v_leads;
  conversion_rate := CASE WHEN v_leads > 0 THEN (v_mqls::NUMERIC / v_leads) * 100 ELSE 0 END;
  RETURN NEXT;
  stage := 'SQLs'; count := v_sqls; previous_stage_count := v_mqls;
  conversion_rate := CASE WHEN v_mqls > 0 THEN (v_sqls::NUMERIC / v_mqls) * 100 ELSE 0 END;
  RETURN NEXT;
  stage := 'Clientes'; count := v_customers; previous_stage_count := v_sqls;
  conversion_rate := CASE WHEN v_sqls > 0 THEN (v_customers::NUMERIC / v_sqls) * 100 ELSE 0 END;
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_score_explicability(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  v_contact RECORD;
  v_interactions_count INTEGER;
  v_last_date TIMESTAMPTZ;
  v_avg_sentiment FLOAT;
  v_days_since_last INTEGER;
BEGIN
  SELECT relationship_score, relationship_stage INTO v_contact
    FROM public.contacts
   WHERE id = p_contact_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  SELECT count(*), max(created_at),
         AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_interactions_count, v_last_date, v_avg_sentiment
    FROM public.interactions
   WHERE contact_id = p_contact_id AND user_id = auth.uid();

  v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));

  RETURN jsonb_build_object(
    'current_score', v_contact.relationship_score,
    'stage', v_contact.relationship_stage,
    'factors', jsonb_build_object(
      'volume', jsonb_build_object('value', v_interactions_count, 'impact', LEAST(v_interactions_count * 10, 100) * 0.4),
      'sentiment', jsonb_build_object('value', COALESCE(v_avg_sentiment, 50), 'impact', COALESCE(v_avg_sentiment, 50) * 0.3),
      'recency', jsonb_build_object('days', v_days_since_last, 'impact',
        CASE WHEN v_days_since_last <= 7 THEN 30 WHEN v_days_since_last <= 30 THEN 15 ELSE 0 END)
    )
  );
END;
$function$;

DROP FUNCTION IF EXISTS public.move_deal_atomic(uuid, text, numeric);

CREATE OR REPLACE FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  v_old_stage TEXT;
  v_is_allowed BOOLEAN;
BEGIN
  SELECT pipeline_stage INTO v_old_stage
    FROM public.deals
   WHERE id = p_deal_id AND user_id = auth.uid()
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal não encontrado: %', p_deal_id;
  END IF;

  SELECT allowed INTO v_is_allowed
    FROM public.pipeline_stage_transitions
   WHERE from_stage = v_old_stage AND to_stage = p_new_stage;
  IF v_is_allowed IS FALSE THEN
    RAISE EXCEPTION 'Transição de % para % não permitida por política de negócio', v_old_stage, p_new_stage;
  END IF;

  UPDATE public.deals
     SET pipeline_stage = p_new_stage,
         probabilidade = COALESCE(p_new_probability, probabilidade),
         updated_at = now()
   WHERE id = p_deal_id;

  RETURN jsonb_build_object('success', true, 'deal_id', p_deal_id, 'from', v_old_stage, 'to', p_new_stage);
END;
$function$;

CREATE OR REPLACE FUNCTION public.seed_conversation_topics(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.conversation_topics_catalog (user_id, topic_key, label, category, keywords, sort_order) VALUES
    (_user_id, 'pricing_discussion', 'Discussão de Preço', 'pricing', ARRAY['preço','valor','custo','investimento','desconto','orçamento'], 1),
    (_user_id, 'roi_value', 'ROI / Valor', 'pricing', ARRAY['roi','retorno','payback','economia','benefício'], 2),
    (_user_id, 'competitor_mention', 'Menção a Concorrente', 'competition', ARRAY['concorrente','competidor','outra opção','comparar','versus'], 3),
    (_user_id, 'product_features', 'Funcionalidades do Produto', 'product', ARRAY['funcionalidade','feature','recurso','como funciona','demo'], 4),
    (_user_id, 'integration_concerns', 'Preocupações de Integração', 'product', ARRAY['integração','integrar','api','sistema atual','migração'], 5),
    (_user_id, 'timing_urgency', 'Timing e Urgência', 'discovery', ARRAY['quando','prazo','urgente','data','cronograma'], 6),
    (_user_id, 'budget_authority', 'Budget e Autoridade', 'discovery', ARRAY['budget','aprovação','decisor','quem decide','board'], 7),
    (_user_id, 'pain_points', 'Dores e Problemas', 'discovery', ARRAY['problema','dor','desafio','dificuldade','frustração'], 8),
    (_user_id, 'objection_price', 'Objeção: Preço Alto', 'objection', ARRAY['caro','alto','não cabe','muito dinheiro'], 9),
    (_user_id, 'objection_timing', 'Objeção: Não é o Momento', 'objection', ARRAY['agora não','depois','outro momento','adiar'], 10),
    (_user_id, 'next_steps', 'Próximos Passos', 'closing', ARRAY['próximo passo','enviar proposta','agendar','follow up'], 11),
    (_user_id, 'commitment_close', 'Pedido de Compromisso', 'closing', ARRAY['fechamos','vamos seguir','assinar','contrato'], 12)
  ON CONFLICT (user_id, topic_key) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.seed_forecast_period(_user_id uuid, _type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  _start DATE;
  _end DATE;
  _id UUID;
  _quota NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _type = 'month' THEN
    _start := date_trunc('month', CURRENT_DATE)::DATE;
    _end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    SELECT default_monthly_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  ELSIF _type = 'quarter' THEN
    _start := date_trunc('quarter', CURRENT_DATE)::DATE;
    _end := (date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::DATE;
    SELECT default_quarterly_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  ELSE
    RAISE EXCEPTION 'Invalid period_type: %', _type;
  END IF;

  INSERT INTO public.forecast_periods (user_id, period_type, period_start, period_end, quota_amount)
  VALUES (_user_id, _type, _start, _end, COALESCE(_quota, 0))
  ON CONFLICT (user_id, period_type, period_start) DO UPDATE SET updated_at = now()
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.cleanup_behavioral_regen_queue(integer,integer,integer)',
    'public.compute_account_health(uuid)',
    'public.compute_attribution(text,text,numeric)',
    'public.compute_revops_kpis(uuid,date,date)',
    'public.cs_renewal_pipeline(uuid,integer)',
    'public.dismiss_revops_alert(uuid)',
    'public.enroll_contact_in_workflow(uuid,uuid)',
    'public.evaluate_mql(uuid)',
    'public.get_connection_metrics(uuid)',
    'public.get_marketing_funnel_stats(uuid,date,date)',
    'public.get_score_explicability(uuid)',
    'public.move_deal_atomic(uuid,text,integer)',
    'public.publish_mtta_sla_breach_alert(integer,integer)',
    'public.seed_conversation_topics(uuid)',
    'public.seed_forecast_period(uuid,text)'
  ]::regprocedure[] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;
