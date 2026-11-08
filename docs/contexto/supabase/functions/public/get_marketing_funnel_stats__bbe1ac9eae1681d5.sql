CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date)
 RETURNS TABLE(stage text, count bigint, previous_stage_count bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
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
$function$
