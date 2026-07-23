
-- compute_revops_kpis: DEFINER -> INVOKER
CREATE OR REPLACE FUNCTION public.compute_revops_kpis(_user_id uuid, _period_start date, _period_end date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _mql_count INT := 0;
  _sql_count INT := 0;
  _opp_count INT := 0;
  _won_count INT := 0;
  _lost_count INT := 0;
  _won_value NUMERIC := 0;
  _open_pipeline NUMERIC := 0;
  _quota NUMERIC := 0;
  _avg_cycle NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COUNT(*) INTO _mql_count
  FROM public.mql_classifications
  WHERE user_id = _user_id
    AND status = 'mql'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _sql_count
  FROM public.mql_classifications
  WHERE user_id = _user_id
    AND status = 'sql'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _opp_count
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COALESCE(SUM(actual_won_amount), 0), COALESCE(SUM(quota_amount), 0)
  INTO _won_value, _quota
  FROM public.forecast_periods
  WHERE user_id = _user_id
    AND period_start >= _period_start
    AND period_end <= _period_end;

  SELECT COALESCE(SUM(amount), 0)
  INTO _open_pipeline
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND category IN ('commit','best_case','pipeline');

  SELECT COUNT(*) INTO _won_count
  FROM public.audit_log
  WHERE user_id = _user_id
    AND entity_type = 'deal_forecasts'
    AND (new_data->>'category') = 'won'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _lost_count
  FROM public.audit_log
  WHERE user_id = _user_id
    AND entity_type = 'deal_forecasts'
    AND (new_data->>'category') = 'lost'
    AND created_at::date BETWEEN _period_start AND _period_end;

  RETURN jsonb_build_object(
    'mql_count', _mql_count,
    'sql_count', _sql_count,
    'opp_count', _opp_count,
    'won_count', _won_count,
    'lost_count', _lost_count,
    'won_value', _won_value,
    'open_pipeline', _open_pipeline,
    'quota', _quota,
    'mql_to_sql_rate', CASE WHEN _mql_count > 0 THEN ROUND((_sql_count::numeric / _mql_count) * 100, 2) ELSE 0 END,
    'sql_to_opp_rate', CASE WHEN _sql_count > 0 THEN ROUND((_opp_count::numeric / _sql_count) * 100, 2) ELSE 0 END,
    'sql_to_won_rate', CASE WHEN _sql_count > 0 THEN ROUND((_won_count::numeric / _sql_count) * 100, 2) ELSE 0 END,
    'win_rate', CASE WHEN (_won_count + _lost_count) > 0 THEN ROUND((_won_count::numeric / (_won_count + _lost_count)) * 100, 2) ELSE 0 END,
    'pipeline_coverage', CASE WHEN _quota > 0 THEN ROUND((_open_pipeline / _quota), 2) ELSE 0 END,
    'quota_attainment', CASE WHEN _quota > 0 THEN ROUND((_won_value / _quota) * 100, 2) ELSE 0 END,
    'avg_cycle_days', _avg_cycle,
    'period_start', _period_start,
    'period_end', _period_end
  );
END;
$function$;

-- compute_account_health: DEFINER -> INVOKER
CREATE OR REPLACE FUNCTION public.compute_account_health(_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _account public.cs_accounts;
  _weighted_sum NUMERIC := 0;
  _weight_total NUMERIC := 0;
  _final_score INT := 50;
  _signal RECORD;
  _decay NUMERIC;
  _days_ago NUMERIC;
  _previous_score INT;
  _trend TEXT := 'stable';
BEGIN
  SELECT * INTO _account FROM public.cs_accounts WHERE id = _account_id;
  IF _account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _account.user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  _previous_score := _account.health_score;

  FOR _signal IN
    SELECT signal_type, score, weight, captured_at
    FROM public.cs_health_signals
    WHERE account_id = _account_id
      AND captured_at >= now() - INTERVAL '90 days'
  LOOP
    _days_ago := EXTRACT(EPOCH FROM (now() - _signal.captured_at)) / 86400.0;
    _decay := exp(-_days_ago / 45.0);
    _weighted_sum := _weighted_sum + (_signal.score * _signal.weight * _decay);
    _weight_total := _weight_total + (_signal.weight * _decay);
  END LOOP;

  IF _weight_total > 0 THEN
    _final_score := GREATEST(0, LEAST(100, ROUND(_weighted_sum / _weight_total)::INT));
  END IF;

  IF _final_score - _previous_score >= 5 THEN
    _trend := 'up';
  ELSIF _previous_score - _final_score >= 5 THEN
    _trend := 'down';
  END IF;

  UPDATE public.cs_accounts
  SET health_score = _final_score,
      health_trend = _trend,
      last_health_recalc_at = now(),
      lifecycle_stage = CASE
        WHEN _final_score < 40 THEN 'at_risk'
        WHEN lifecycle_stage = 'at_risk' AND _final_score >= 60 THEN 'mature'
        ELSE lifecycle_stage
      END
  WHERE id = _account_id;

  RETURN jsonb_build_object(
    'account_id', _account_id,
    'previous_score', _previous_score,
    'new_score', _final_score,
    'trend', _trend,
    'signals_considered', (SELECT COUNT(*) FROM public.cs_health_signals WHERE account_id = _account_id AND captured_at >= now() - INTERVAL '90 days')
  );
END;
$function$;

-- evaluate_mql: DEFINER -> INVOKER
CREATE OR REPLACE FUNCTION public.evaluate_mql(_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _criterion RECORD;
  _matched UUID;
  _score INT := 0;
  _classification_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COALESCE(lead_score, 0) INTO _score FROM public.contacts WHERE id = _contact_id AND user_id = auth.uid();

  FOR _criterion IN
    SELECT * FROM public.mql_criteria
    WHERE user_id = auth.uid() AND is_active = true
    ORDER BY priority DESC, created_at ASC
  LOOP
    IF (_criterion.conditions->>'min_score')::INT IS NULL OR _score >= (_criterion.conditions->>'min_score')::INT THEN
      _matched := _criterion.id;
      EXIT;
    END IF;
  END LOOP;

  IF _matched IS NULL THEN
    RETURN jsonb_build_object('qualified', false, 'score', _score);
  END IF;

  INSERT INTO public.mql_classifications (user_id, contact_id, criteria_id, status, score_snapshot, reason)
  VALUES (auth.uid(), _contact_id, _matched, 'mql', _score, 'Auto-evaluated')
  ON CONFLICT DO NOTHING
  RETURNING id INTO _classification_id;

  IF _classification_id IS NULL THEN
    SELECT id INTO _classification_id FROM public.mql_classifications
    WHERE user_id = auth.uid() AND contact_id = _contact_id
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'qualified', true,
    'score', _score,
    'criteria_id', _matched,
    'classification_id', _classification_id
  );
END;
$function$;
