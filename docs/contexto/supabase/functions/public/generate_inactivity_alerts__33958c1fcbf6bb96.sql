CREATE OR REPLACE FUNCTION public.generate_inactivity_alerts(p_threshold_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
  v_company RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Limpar alertas antigos resolvidos
  DELETE FROM inactivity_alerts WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '30 days';
  
  -- Gerar alertas para empresas inativas
  FOR v_company IN
    SELECT 
      c.id as company_id,
      COALESCE(c.nome_fantasia, c.nome_crm) as company_name,
      MAX(i.data_interacao) as last_interaction,
      EXTRACT(DAY FROM NOW() - MAX(i.data_interacao))::int as days_inactive
    FROM companies c
    LEFT JOIN interactions i ON i.company_id = c.id
    WHERE c.deleted_at IS NULL
      AND c.status = 'ativo'
    GROUP BY c.id, c.nome_fantasia, c.nome_crm
    HAVING MAX(i.data_interacao) < NOW() - (p_threshold_days || ' days')::interval
       OR MAX(i.data_interacao) IS NULL
  LOOP
    -- Inserir alerta se não existir ativo
    INSERT INTO inactivity_alerts (
      alert_type, company_id, days_inactive, last_interaction_date, severity, risk_score, urgency_reason
    )
    SELECT 
      'company_inactive',
      v_company.company_id,
      COALESCE(v_company.days_inactive, 999),
      v_company.last_interaction,
      CASE 
        WHEN COALESCE(v_company.days_inactive, 999) > 180 THEN 'critical'
        WHEN COALESCE(v_company.days_inactive, 999) > 90 THEN 'high'
        WHEN COALESCE(v_company.days_inactive, 999) > 60 THEN 'medium'
        ELSE 'low'
      END,
      CASE 
        WHEN COALESCE(v_company.days_inactive, 999) > 180 THEN 90
        WHEN COALESCE(v_company.days_inactive, 999) > 90 THEN 70
        WHEN COALESCE(v_company.days_inactive, 999) > 60 THEN 50
        ELSE 30
      END,
      'Empresa sem interação há ' || COALESCE(v_company.days_inactive, 999) || ' dias'
    WHERE NOT EXISTS (
      SELECT 1 FROM inactivity_alerts 
      WHERE company_id = v_company.company_id 
        AND status = 'active'
        AND alert_type = 'company_inactive'
    );
    
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  
  RETURN jsonb_build_object('alerts_created', v_count, 'threshold_days', p_threshold_days, 'generated_at', NOW());
END;
$function$
