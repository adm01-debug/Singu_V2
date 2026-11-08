CREATE OR REPLACE FUNCTION public.get_win_loss_rate(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_won integer;
  v_lost integer;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE status = 'ganho'),
    COUNT(*) FILTER (WHERE status = 'perdido')
  INTO v_won, v_lost
  FROM deals
  WHERE closed_at >= CURRENT_DATE - p_days;
  
  RETURN jsonb_build_object(
    'deals_won', v_won,
    'deals_lost', v_lost,
    'total_closed', v_won + v_lost,
    'win_rate', CASE WHEN v_won + v_lost > 0 THEN ROUND((v_won::numeric / (v_won + v_lost) * 100), 1) ELSE 0 END,
    'loss_rate', CASE WHEN v_won + v_lost > 0 THEN ROUND((v_lost::numeric / (v_won + v_lost) * 100), 1) ELSE 0 END,
    'competitive_losses', (SELECT COUNT(*) FROM competitive_losses WHERE created_at >= CURRENT_DATE - p_days),
    'period_days', p_days
  );
END;
$function$
