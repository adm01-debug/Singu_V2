CREATE OR REPLACE FUNCTION public.cs_renewal_pipeline(_user_id uuid, _days_ahead integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
$function$
