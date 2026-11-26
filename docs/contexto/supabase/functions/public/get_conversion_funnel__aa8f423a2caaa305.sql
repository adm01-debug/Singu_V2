CREATE OR REPLACE FUNCTION public.get_conversion_funnel(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
  v_leads int;
  v_contacted int;
  v_qualified int;
  v_proposal int;
  v_won int;
BEGIN
  SELECT COUNT(*) INTO v_leads
  FROM companies WHERE created_at >= NOW() - (p_days || ' days')::interval AND deleted_at IS NULL;

  SELECT COUNT(DISTINCT company_id) INTO v_contacted
  FROM interactions WHERE data_interacao >= NOW() - (p_days || ' days')::interval;

  -- company_status no canônico: ativo/inativo/suspenso
  SELECT COUNT(*) INTO v_qualified
  FROM companies WHERE status = 'ativo' AND updated_at >= NOW() - (p_days || ' days')::interval;

  SELECT COUNT(*) INTO v_proposal
  FROM deals WHERE created_at >= NOW() - (p_days || ' days')::interval;

  SELECT COUNT(*) INTO v_won
  FROM deals WHERE status = 'ganho' AND updated_at >= NOW() - (p_days || ' days')::interval;

  v_result := jsonb_build_object(
    'period_days', p_days,
    'stages', jsonb_build_array(
      jsonb_build_object('stage', 'leads', 'count', v_leads, 'pct', 100),
      jsonb_build_object('stage', 'contacted', 'count', v_contacted, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_contacted::numeric/v_leads)*100,1) ELSE 0 END),
      jsonb_build_object('stage', 'qualified', 'count', v_qualified, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_qualified::numeric/v_leads)*100,1) ELSE 0 END),
      jsonb_build_object('stage', 'proposal', 'count', v_proposal, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_proposal::numeric/v_leads)*100,1) ELSE 0 END),
      jsonb_build_object('stage', 'won', 'count', v_won, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_won::numeric/v_leads)*100,1) ELSE 0 END)
    ),
    'overall_conversion', CASE WHEN v_leads > 0 THEN ROUND((v_won::numeric/v_leads)*100,2) ELSE 0 END,
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$function$
