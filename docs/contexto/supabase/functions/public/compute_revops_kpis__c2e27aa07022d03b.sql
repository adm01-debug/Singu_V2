CREATE OR REPLACE FUNCTION public.compute_revops_kpis(_user_id uuid, _period_start date, _period_end date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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

  -- Opportunities (deal_forecasts as proxy)
  SELECT COUNT(*) INTO _opp_count
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND created_at::date BETWEEN _period_start AND _period_end;

  -- Won deals via forecast_periods (actual_won_amount) when present
  SELECT COALESCE(SUM(actual_won_amount), 0), COALESCE(SUM(quota_amount), 0)
  INTO _won_value, _quota
  FROM public.forecast_periods
  WHERE user_id = _user_id
    AND period_start >= _period_start
    AND period_end <= _period_end;

  SELECT COALESCE(SUM(forecasted_amount), 0)
  INTO _open_pipeline
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND category IN ('commit','best_case','pipeline');

  -- Won/lost counts via audit if available
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
$function$
