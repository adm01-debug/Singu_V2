CREATE OR REPLACE FUNCTION public.run_custom_report(p_report_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_report record;
  v_result jsonb;
  v_config jsonb;
  v_data jsonb;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_report FROM custom_reports WHERE id = p_report_id;
  
  IF v_report IS NULL THEN
    RETURN jsonb_build_object('error', 'Report not found');
  END IF;
  
  v_config := v_report.query_config;
  
  -- Monta dados baseado na configuração
  SELECT jsonb_build_object(
    'companies', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM companies 
                WHERE (v_config->>'status' IS NULL OR status::text = v_config->>'status')
                  AND (v_config->>'segment' IS NULL OR segment ILIKE '%' || (v_config->>'segment') || '%')),
      'by_status', (
        SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
        FROM (SELECT status::text, COUNT(*) as cnt FROM companies GROUP BY status) t
      ),
      'by_state', (
        SELECT COALESCE(jsonb_object_agg(COALESCE(state, 'N/A'), cnt), '{}'::jsonb)
        FROM (SELECT state, COUNT(*) as cnt FROM companies WHERE status = 'ativo' GROUP BY state ORDER BY cnt DESC LIMIT 10) t
      )
    ),
    'interactions', jsonb_build_object(
      'total_30d', (SELECT COUNT(*) FROM interactions WHERE created_at >= NOW() - interval '30 days'),
      'by_type', (
        SELECT COALESCE(jsonb_object_agg(type, cnt), '{}'::jsonb)
        FROM (SELECT type, COUNT(*) as cnt FROM interactions WHERE created_at >= NOW() - interval '30 days' GROUP BY type) t
      )
    ),
    'contacts', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM contacts),
      'with_email', (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL),
      'with_phone', (SELECT COUNT(*) FROM contacts WHERE phone IS NOT NULL OR mobile IS NOT NULL)
    )
  ) INTO v_data;
  
  -- Atualiza contador
  UPDATE custom_reports SET run_count = run_count + 1, last_run_at = NOW() WHERE id = p_report_id;
  
  RETURN jsonb_build_object(
    'report_id', p_report_id,
    'report_name', v_report.name,
    'report_type', v_report.report_type,
    'data', v_data,
    'generated_at', NOW()
  );
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('error', 'Tables not initialized');
END;
$function$
