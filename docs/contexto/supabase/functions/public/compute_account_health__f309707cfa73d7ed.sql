CREATE OR REPLACE FUNCTION public.compute_account_health(_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
  _breakdown JSONB := '{}'::jsonb;
  _category_sums JSONB := '{}'::jsonb;
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
    _decay := exp(-_days_ago / 45.0); -- meia-vida ~31 dias
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
$function$
