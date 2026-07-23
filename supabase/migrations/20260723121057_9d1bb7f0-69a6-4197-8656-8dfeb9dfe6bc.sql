
-- Rodada 35/10 — Onda G Bucket B (lote 3): DEFINER → INVOKER em 3 funções de seed user-scoped

CREATE OR REPLACE FUNCTION public.seed_lead_score_defaults(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.lead_score_thresholds (user_id, grade, min_score) VALUES
    (_user_id, 'A', 80),
    (_user_id, 'B', 60),
    (_user_id, 'C', 40),
    (_user_id, 'D', 0)
  ON CONFLICT (user_id, grade) DO NOTHING;

  INSERT INTO public.lead_score_rules (user_id, dimension, signal_key, weight, decay_days) VALUES
    (_user_id, 'fit', 'company_present', 10, 365),
    (_user_id, 'fit', 'role_present', 8, 365),
    (_user_id, 'fit', 'email_present', 5, 365),
    (_user_id, 'fit', 'phone_present', 5, 365),
    (_user_id, 'engagement', 'interaction', 3, 30),
    (_user_id, 'engagement', 'recent_interaction_7d', 10, 14),
    (_user_id, 'engagement', 'email_open', 2, 14),
    (_user_id, 'engagement', 'email_click', 5, 14),
    (_user_id, 'engagement', 'email_reply', 12, 30),
    (_user_id, 'engagement', 'sequence_completed', 8, 30),
    (_user_id, 'intent', 'page_view', 2, 14),
    (_user_id, 'intent', 'pricing_view', 8, 14),
    (_user_id, 'intent', 'demo_request', 15, 30),
    (_user_id, 'intent', 'form_submit', 10, 21),
    (_user_id, 'intent', 'email_click', 4, 14),
    (_user_id, 'intent', 'content_download', 6, 21),
    (_user_id, 'relationship', 'relationship_score', 1, 60)
  ON CONFLICT (user_id, dimension, signal_key) DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.seed_conversation_topics(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
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

-- seed_forecast_period: manter corpo original mas mudar segurança + guard
DO $mig$
DECLARE
  _body text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO _body FROM pg_proc WHERE proname = 'seed_forecast_period' AND pronamespace = 'public'::regnamespace;
  -- Não vamos reescrever; apenas ALTER seguridade
  EXECUTE 'ALTER FUNCTION public.seed_forecast_period(uuid, text) SECURITY INVOKER';
END;
$mig$;

-- Adicionar guard via wrapper CREATE OR REPLACE preservando lógica
CREATE OR REPLACE FUNCTION public.seed_forecast_period(_user_id uuid, _type text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _start DATE;
  _end DATE;
  _id UUID;
  _quota NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
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
    _start := date_trunc('year', CURRENT_DATE)::DATE;
    _end := (date_trunc('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE;
    SELECT default_annual_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  END IF;

  INSERT INTO public.forecast_periods (user_id, period_type, period_start, period_end, quota_amount)
  VALUES (_user_id, _type, _start, _end, COALESCE(_quota, 0))
  ON CONFLICT (user_id, period_type, period_start) DO UPDATE SET quota_amount = EXCLUDED.quota_amount
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$;
