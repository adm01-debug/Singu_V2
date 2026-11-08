CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_badge record;
  v_new_badges jsonb := '[]'::jsonb;
  v_interactions_count integer;
  v_deals_won integer;
  v_revenue numeric;
  v_consecutive_days integer;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Contar métricas do usuário
  SELECT COUNT(*) INTO v_interactions_count
  FROM interactions WHERE user_id = p_user_id AND data_interacao >= CURRENT_DATE - 30;

  SELECT COUNT(*) INTO v_deals_won
  FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE);

  SELECT COALESCE(SUM(valor), 0) INTO v_revenue
  FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE);

  -- Verificar badges não conquistados
  FOR v_badge IN 
    SELECT b.* FROM badges b
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub WHERE ub.badge_id = b.id AND ub.user_id = p_user_id
    )
  LOOP
    -- Verificar critérios (exemplo simplificado)
    IF v_badge.code = 'FIRST_INTERACTION' AND v_interactions_count >= 1 THEN
      INSERT INTO user_badges (id, user_id, badge_id, earned_at)
      VALUES (gen_random_uuid(), p_user_id, v_badge.id, NOW());
      v_new_badges := v_new_badges || jsonb_build_object('code', v_badge.code, 'name', v_badge.name);
    
    ELSIF v_badge.code = 'DEAL_CLOSER' AND v_deals_won >= 1 THEN
      INSERT INTO user_badges (id, user_id, badge_id, earned_at)
      VALUES (gen_random_uuid(), p_user_id, v_badge.id, NOW());
      v_new_badges := v_new_badges || jsonb_build_object('code', v_badge.code, 'name', v_badge.name);
    
    ELSIF v_badge.code = 'SUPER_SELLER' AND v_deals_won >= 10 THEN
      INSERT INTO user_badges (id, user_id, badge_id, earned_at)
      VALUES (gen_random_uuid(), p_user_id, v_badge.id, NOW());
      v_new_badges := v_new_badges || jsonb_build_object('code', v_badge.code, 'name', v_badge.name);
    
    ELSIF v_badge.code = 'REVENUE_HUNTER' AND v_revenue >= 50000 THEN
      INSERT INTO user_badges (id, user_id, badge_id, earned_at)
      VALUES (gen_random_uuid(), p_user_id, v_badge.id, NOW());
      v_new_badges := v_new_badges || jsonb_build_object('code', v_badge.code, 'name', v_badge.name);
    
    ELSIF v_badge.code = 'ACTIVITY_MASTER' AND v_interactions_count >= 100 THEN
      INSERT INTO user_badges (id, user_id, badge_id, earned_at)
      VALUES (gen_random_uuid(), p_user_id, v_badge.id, NOW());
      v_new_badges := v_new_badges || jsonb_build_object('code', v_badge.code, 'name', v_badge.name);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'checked_at', NOW(),
    'new_badges_count', jsonb_array_length(v_new_badges),
    'new_badges', v_new_badges,
    'metrics', jsonb_build_object(
      'interactions_30d', v_interactions_count,
      'deals_won_month', v_deals_won,
      'revenue_month', v_revenue
    )
  );
END;
$function$
