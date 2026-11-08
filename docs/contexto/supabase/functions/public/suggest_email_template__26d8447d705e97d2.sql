CREATE OR REPLACE FUNCTION public.suggest_email_template(p_company_id uuid, p_context text DEFAULT 'follow_up'::text)
 RETURNS TABLE(template_id uuid, template_name text, relevance_score integer, reason text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_interaction_type text;
  v_days_since_interaction int;
BEGIN
  SELECT type, EXTRACT(DAY FROM NOW() - data_interacao)::int
  INTO v_last_interaction_type, v_days_since_interaction
  FROM interactions WHERE company_id = p_company_id
  ORDER BY data_interacao DESC LIMIT 1;
  
  RETURN QUERY
  SELECT 
    t.id as template_id,
    t.name::text as template_name,
    CASE 
      WHEN t.category = p_context THEN 100
      WHEN t.category = v_last_interaction_type THEN 80
      ELSE 50
    END::int as relevance_score,
    ('Sugerido para ' || p_context)::text as reason
  FROM interaction_templates t
  WHERE t.deleted_at IS NULL AND t.type = 'email'
  ORDER BY relevance_score DESC
  LIMIT 5;
END;
$function$
