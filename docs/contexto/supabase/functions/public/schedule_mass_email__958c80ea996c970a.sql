CREATE OR REPLACE FUNCTION public.schedule_mass_email(p_template_id uuid, p_company_ids uuid[], p_scheduled_for timestamp with time zone, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
  v_company_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  FOREACH v_company_id IN ARRAY p_company_ids LOOP
    INSERT INTO interactions (company_id, type, channel, direction, resumo, content, user_id, data_interacao, metadata)
    SELECT 
      v_company_id, 
      'email', 
      'email', 
      'outbound',
      t.subject,
      t.content,
      p_user_id,
      p_scheduled_for,
      jsonb_build_object('template_id', p_template_id, 'scheduled', true, 'mass_email', true)
    FROM interaction_templates t WHERE t.id = p_template_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'scheduled_count', v_count,
    'scheduled_for', p_scheduled_for
  );
END;
$function$
