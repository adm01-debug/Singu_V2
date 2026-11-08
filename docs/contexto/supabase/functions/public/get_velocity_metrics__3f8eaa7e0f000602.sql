CREATE OR REPLACE FUNCTION public.get_velocity_metrics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$ DECLARE result jsonb; total_won int; total_closed int; avg_size numeric; BEGIN SELECT COUNT(*) INTO total_won FROM deals WHERE user_id = p_user_id AND status = 'won'; SELECT COUNT(*) INTO total_closed FROM deals WHERE user_id = p_user_id AND status IN ('won','lost'); SELECT COALESCE(AVG(valor), 0) INTO avg_size FROM deals WHERE user_id = p_user_id AND status = 'won'; SELECT jsonb_build_object( 'avg_cycle_days', 0, 'median_cycle_days', 0, 'win_rate', CASE WHEN total_closed > 0 THEN ROUND((total_won::numeric / total_closed) * 100, 2) ELSE 0 END, 'avg_deal_size', avg_size, 'velocity_score', LEAST(100, total_won * 10) ) INTO result; RETURN result; END; $function$
