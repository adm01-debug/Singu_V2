CREATE OR REPLACE FUNCTION public.get_sales_opportunities(p_user_id uuid DEFAULT NULL::uuid, p_opportunity_type text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, company_id uuid, company_name text, opportunity_type text, title text, estimated_value numeric, confidence_score integer, priority text, status text, assigned_to_name text, due_date date, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    so.id,
    so.company_id,
    c.nome_crm,
    so.opportunity_type,
    so.title,
    so.estimated_value,
    so.confidence_score,
    so.priority,
    so.status,
    p.full_name,
    so.due_date,
    so.created_at
  FROM sales_opportunities so
  JOIN companies c ON c.id = so.company_id
  LEFT JOIN profiles p ON p.id = so.assigned_to
  WHERE (p_user_id IS NULL OR so.assigned_to = p_user_id)
    AND (p_opportunity_type IS NULL OR so.opportunity_type = p_opportunity_type)
    AND (p_status IS NULL OR so.status = p_status)
  ORDER BY 
    CASE so.priority 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      ELSE 4 
    END,
    so.estimated_value DESC
  LIMIT p_limit;
END;
$function$
