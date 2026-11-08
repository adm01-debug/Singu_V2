CREATE OR REPLACE FUNCTION public.calculate_company_sla(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_first_interaction timestamptz;
  v_last_interaction timestamptz;
  v_company_created timestamptz;
  v_response_time interval;
  v_sla_hours integer := 24;
BEGIN
  SELECT created_at INTO v_company_created FROM companies WHERE id = p_company_id;
  SELECT MIN(data_interacao), MAX(data_interacao) INTO v_first_interaction, v_last_interaction 
  FROM interactions WHERE company_id = p_company_id;
  
  IF v_first_interaction IS NOT NULL THEN
    v_response_time := v_first_interaction - v_company_created;
  END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'created_at', v_company_created,
    'first_response_at', v_first_interaction,
    'response_time_hours', EXTRACT(EPOCH FROM v_response_time) / 3600,
    'sla_target_hours', v_sla_hours,
    'sla_met', v_first_interaction IS NOT NULL AND EXTRACT(EPOCH FROM v_response_time) / 3600 <= v_sla_hours,
    'last_interaction', v_last_interaction,
    'days_since_last_contact', EXTRACT(DAY FROM NOW() - COALESCE(v_last_interaction, v_company_created))
  );
END;
$function$
