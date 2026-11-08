CREATE OR REPLACE FUNCTION public.get_weighted_forecast(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$ BEGIN RETURN COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT pipeline_stage AS stage, COUNT(*)::int AS count, COALESCE(SUM(valor), 0)::numeric AS total_value, COALESCE(AVG(probabilidade), 0)::numeric AS probability, COALESCE(SUM(valor * probabilidade / 100.0), 0)::numeric AS weighted_value FROM deals WHERE user_id = p_user_id AND status NOT IN ('won','lost') GROUP BY pipeline_stage ORDER BY pipeline_stage) t), '[]'::jsonb); END; $function$
