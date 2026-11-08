CREATE OR REPLACE FUNCTION public.compute_attribution(_deal_id text, _model text DEFAULT 'linear'::text, _deal_value numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _allocations JSONB := '[]'::jsonb;
  _tps RECORD;
  _count INT := 0;
  _total INT;
  _share NUMERIC;
  _arr JSONB := '[]'::jsonb;
  _i INT := 0;
BEGIN
  SELECT COUNT(*) INTO _total
  FROM public.attribution_touchpoints
  WHERE user_id = auth.uid() AND deal_id = _deal_id;

  IF _total = 0 THEN
    RETURN jsonb_build_object('model', _model, 'allocations', '[]'::jsonb, 'total_value', _deal_value);
  END IF;

  FOR _tps IN
    SELECT id, touchpoint_type, source, medium, campaign, occurred_at
    FROM public.attribution_touchpoints
    WHERE user_id = auth.uid() AND deal_id = _deal_id
    ORDER BY occurred_at ASC
  LOOP
    _share := CASE _model
      WHEN 'first' THEN CASE WHEN _i = 0 THEN 1 ELSE 0 END
      WHEN 'last' THEN CASE WHEN _i = _total - 1 THEN 1 ELSE 0 END
      WHEN 'linear' THEN 1.0 / _total
      WHEN 'u_shape' THEN
        CASE
          WHEN _total = 1 THEN 1
          WHEN _total = 2 THEN 0.5
          WHEN _i = 0 OR _i = _total - 1 THEN 0.4
          ELSE 0.2 / (_total - 2)
        END
      WHEN 'w_shape' THEN
        CASE
          WHEN _total <= 2 THEN 1.0 / _total
          WHEN _total = 3 THEN CASE WHEN _i = 1 THEN 0.3 ELSE 0.35 END
          WHEN _i = 0 OR _i = _total - 1 OR _i = (_total / 2) THEN 0.3
          ELSE 0.1 / (_total - 3)
        END
      WHEN 'time_decay' THEN power(2, _i::numeric / GREATEST(_total - 1, 1)) / (
        SELECT SUM(power(2, g::numeric / GREATEST(_total - 1, 1))) FROM generate_series(0, _total - 1) g
      )
      ELSE 1.0 / _total
    END;

    _arr := _arr || jsonb_build_object(
      'touchpoint_id', _tps.id,
      'type', _tps.touchpoint_type,
      'source', _tps.source,
      'medium', _tps.medium,
      'campaign', _tps.campaign,
      'occurred_at', _tps.occurred_at,
      'share', ROUND(_share::numeric, 4),
      'value', ROUND((_share * _deal_value)::numeric, 2)
    );
    _i := _i + 1;
  END LOOP;

  INSERT INTO public.attribution_models_cache (user_id, deal_id, model, allocations, total_value)
  VALUES (auth.uid(), _deal_id, _model, _arr, _deal_value)
  ON CONFLICT (user_id, deal_id, model) DO UPDATE
    SET allocations = EXCLUDED.allocations,
        total_value = EXCLUDED.total_value,
        computed_at = now();

  RETURN jsonb_build_object('model', _model, 'allocations', _arr, 'total_value', _deal_value, 'touchpoints_count', _total);
END;
$function$
