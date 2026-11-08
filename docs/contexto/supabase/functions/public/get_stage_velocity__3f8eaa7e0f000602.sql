CREATE OR REPLACE FUNCTION public.get_stage_velocity(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$ BEGIN RETURN COALESCE((SELECT jsonb_agg(row_to_json(t)) FROM (SELECT pipeline_stage AS stage, 0::numeric AS avg_days, 0::numeric AS median_days, COUNT(*)::int AS deal_count FROM deals WHERE user_id = p_user_id GROUP BY pipeline_stage ORDER BY pipeline_stage) t), '[]'::jsonb); END; $function$
