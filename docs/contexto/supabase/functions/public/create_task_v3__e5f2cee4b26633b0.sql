CREATE OR REPLACE FUNCTION public.create_task_v3(p_title text, p_owner_id uuid, p_task_type text DEFAULT 'general'::text, p_priority text DEFAULT 'medium'::text, p_due_date date DEFAULT NULL::date, p_company_id uuid DEFAULT NULL::uuid, p_contact_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_created_by_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO tasks (
    title, description, task_type, priority, due_date,
    company_id, contact_id, deal_id, owner_id, created_by_id, status
  ) VALUES (
    p_title, p_description, p_task_type, p_priority, p_due_date,
    p_company_id, p_contact_id, p_deal_id, p_owner_id, p_created_by_id, 'pending'
  )
  RETURNING id INTO v_task_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'task_id', v_task_id
  );
END;
$function$
