CREATE OR REPLACE FUNCTION public.generate_reactivation_tasks(p_days_inactive integer DEFAULT 30, p_assignee_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
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
  FOR v_company IN 
    SELECT * FROM get_inactive_companies(p_days_inactive, p_limit)
    WHERE priority IN ('CRÍTICA', 'ALTA')
  LOOP
    INSERT INTO tasks (title, description, company_id, assignee_id, task_type, priority, due_date, status)
    VALUES (
      'Reativar: ' || v_company.company_name,
      'Inativo há ' || v_company.days_inactive || ' dias. Receita: R$ ' || v_company.total_revenue,
      v_company.company_id,
      COALESCE(p_assignee_id, (SELECT user_id FROM companies WHERE id = v_company.company_id)),
      'reactivation',
      CASE WHEN v_company.priority = 'CRÍTICA' THEN 'urgent' ELSE 'high' END,
      CURRENT_DATE + 3,
      'pending'
    ) ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'tasks_created', v_count);
END;
$function$
