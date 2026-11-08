CREATE OR REPLACE FUNCTION public.clone_workflow_setup(p_source_company_id uuid, p_target_company_id uuid, p_include_scheduled boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_cloned INT := 0;
BEGIN
  PERFORM public.assert_company_access(p_source_company_id);
  PERFORM public.assert_company_access(p_target_company_id);

  IF p_include_scheduled THEN
    INSERT INTO interactions (
      id, company_id, type, channel, direction, title, status,
      data_agendada, metadata, user_id, created_at
    )
    SELECT
      gen_random_uuid(),
      p_target_company_id,
      type, channel, direction, title, 'agendado',
      data_agendada + INTERVAL '1 day',
      metadata || jsonb_build_object('cloned_from', id),
      user_id, NOW()
    FROM interactions
    WHERE company_id = p_source_company_id
      AND type = 'scheduled_task'
      AND status = 'agendado';

    GET DIAGNOSTICS v_cloned = ROW_COUNT;
  END IF;

  RETURN v_cloned;
END;
$function$
