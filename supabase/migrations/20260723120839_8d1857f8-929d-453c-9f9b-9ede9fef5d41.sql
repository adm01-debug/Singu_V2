
-- Rodada 34/10: DEFINER -> INVOKER em 3 funções analíticas
-- Todas leem apenas tabelas com RLS por user_id/contact_id já validada.

CREATE OR REPLACE FUNCTION public.get_score_explicability(p_contact_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_contact RECORD;
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_factors JSONB;
BEGIN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;

    SELECT count(*), max(created_at) INTO v_interactions_count, v_last_date
    FROM public.interactions WHERE contact_id = p_contact_id;

    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));

    SELECT AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_avg_sentiment FROM public.interactions WHERE contact_id = p_contact_id;

    v_factors := jsonb_build_object(
        'volume', jsonb_build_object('value', v_interactions_count, 'impact', LEAST(v_interactions_count * 10, 100) * 0.4),
        'sentiment', jsonb_build_object('value', COALESCE(v_avg_sentiment, 50), 'impact', COALESCE(v_avg_sentiment, 50) * 0.3),
        'recency', jsonb_build_object('days', v_days_since_last, 'impact',
            CASE
                WHEN v_days_since_last <= 7 THEN 30
                WHEN v_days_since_last <= 30 THEN 15
                ELSE 0
            END)
    );

    RETURN jsonb_build_object(
        'current_score', v_contact.relationship_score,
        'stage', v_contact.relationship_stage,
        'factors', v_factors
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cs_renewal_pipeline(_user_id uuid, _days_ahead integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _result JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'total_count', COUNT(*),
    'total_arr', COALESCE(SUM(r.forecasted_arr), 0),
    'at_risk_count', COUNT(*) FILTER (WHERE r.risk_level IN ('high','critical')),
    'at_risk_arr', COALESCE(SUM(r.forecasted_arr) FILTER (WHERE r.risk_level IN ('high','critical')), 0),
    'renewals', COALESCE(jsonb_agg(jsonb_build_object(
      'id', r.id,
      'account_id', r.account_id,
      'account_name', a.account_name,
      'tier', a.tier,
      'health_score', a.health_score,
      'renewal_date', r.renewal_date,
      'days_until', (r.renewal_date - CURRENT_DATE),
      'status', r.status,
      'forecasted_arr', r.forecasted_arr,
      'risk_level', r.risk_level
    ) ORDER BY r.renewal_date ASC), '[]'::jsonb)
  ) INTO _result
  FROM public.cs_renewals r
  JOIN public.cs_accounts a ON a.id = r.account_id
  WHERE r.user_id = _user_id
    AND r.status IN ('upcoming','in_negotiation')
    AND r.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (_days_ahead || ' days')::INTERVAL;

  RETURN _result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date)
RETURNS TABLE(stage text, count bigint, previous_stage_count bigint, conversion_rate numeric)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_views BIGINT;
    v_leads BIGINT;
    v_mqls BIGINT;
    v_sqls BIGINT;
    v_customers BIGINT;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;

    SELECT COALESCE(SUM(view_count), 0) INTO v_views
    FROM public.lead_magnets WHERE user_id = _user_id;

    SELECT COUNT(*) INTO v_leads
    FROM public.form_submissions s
    JOIN public.marketing_forms f ON s.form_id = f.id
    WHERE f.user_id = _user_id AND s.created_at BETWEEN _start_date AND _end_date;

    SELECT COUNT(*) INTO v_mqls
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'mql' AND qualified_at BETWEEN _start_date AND _end_date;

    SELECT COUNT(*) INTO v_sqls
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'sql' AND handoff_at BETWEEN _start_date AND _end_date;

    SELECT COUNT(*) INTO v_customers
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'customer' AND handoff_at BETWEEN _start_date AND _end_date;

    stage := 'Visualizações'; count := v_views; previous_stage_count := v_views; conversion_rate := 100;
    RETURN NEXT;

    stage := 'Leads'; count := v_leads; previous_stage_count := v_views;
    conversion_rate := CASE WHEN v_views > 0 THEN (v_leads::DECIMAL / v_views) * 100 ELSE 0 END;
    RETURN NEXT;

    stage := 'MQLs'; count := v_mqls; previous_stage_count := v_leads;
    conversion_rate := CASE WHEN v_leads > 0 THEN (v_mqls::DECIMAL / v_leads) * 100 ELSE 0 END;
    RETURN NEXT;

    stage := 'SQLs'; count := v_sqls; previous_stage_count := v_mqls;
    conversion_rate := CASE WHEN v_mqls > 0 THEN (v_sqls::DECIMAL / v_mqls) * 100 ELSE 0 END;
    RETURN NEXT;

    stage := 'Clientes'; count := v_customers; previous_stage_count := v_sqls;
    conversion_rate := CASE WHEN v_sqls > 0 THEN (v_customers::DECIMAL / v_sqls) * 100 ELSE 0 END;
    RETURN NEXT;
END;
$function$;
