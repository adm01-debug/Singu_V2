CREATE OR REPLACE FUNCTION public.create_sales_opportunity(p_company_id uuid, p_opportunity_type text, p_title text, p_estimated_value numeric DEFAULT 0, p_description text DEFAULT NULL::text, p_priority text DEFAULT 'medium'::text, p_assigned_to uuid DEFAULT NULL::uuid, p_due_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_opp_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO sales_opportunities (
    company_id, opportunity_type, title, description,
    estimated_value, priority, assigned_to, due_date, source
  ) VALUES (
    p_company_id, p_opportunity_type, p_title, p_description,
    p_estimated_value, p_priority, p_assigned_to, p_due_date, 'manual'
  )
  RETURNING id INTO v_opp_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'opportunity_id', v_opp_id
  );
END;
$function$
