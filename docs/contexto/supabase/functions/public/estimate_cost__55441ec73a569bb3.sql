CREATE OR REPLACE FUNCTION public.estimate_cost(p_model text, p_input_tokens integer, p_output_tokens integer)
 RETURNS TABLE(model text, input_cost double precision, output_cost double precision, total_cost double precision, total_cost_brl double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.model,
    (m.input_cost_per_1m * p_input_tokens / 1000000.0)::FLOAT,
    (m.output_cost_per_1m * p_output_tokens / 1000000.0)::FLOAT,
    ((m.input_cost_per_1m * p_input_tokens + m.output_cost_per_1m * p_output_tokens) / 1000000.0)::FLOAT,
    ((m.input_cost_per_1m * p_input_tokens + m.output_cost_per_1m * p_output_tokens) / 1000000.0 * 5.50)::FLOAT
  FROM model_pricing_v2 m
  WHERE m.model = p_model
  LIMIT 1;
END;
$function$
