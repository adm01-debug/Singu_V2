CREATE OR REPLACE FUNCTION public.create_task(p_title text, p_due_date date, p_company_id uuid DEFAULT NULL::uuid, p_task_type text DEFAULT 'todo'::text, p_priority text DEFAULT 'medium'::text, p_description text DEFAULT NULL::text, p_contact_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO tasks (user_id, company_id, contact_id, deal_id, title, description, task_type, priority, due_date)
  VALUES (p_user_id, p_company_id, p_contact_id, p_deal_id, p_title, p_description, p_task_type, p_priority, p_due_date)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
