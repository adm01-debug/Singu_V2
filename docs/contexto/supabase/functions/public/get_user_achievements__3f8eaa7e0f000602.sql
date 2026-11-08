CREATE OR REPLACE FUNCTION public.get_user_achievements(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_achievements jsonb := '[]'::jsonb;
  v_deals_won int;
  v_revenue numeric;
  v_interactions int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT COUNT(*) INTO v_deals_won FROM deals WHERE user_id = p_user_id AND status = 'ganho';
  SELECT COALESCE(SUM(valor), 0) INTO v_revenue FROM deals WHERE user_id = p_user_id AND status = 'ganho';
  SELECT COUNT(*) INTO v_interactions FROM interactions WHERE user_id = p_user_id;
  
  -- Conquistas de deals
  IF v_deals_won >= 1 THEN v_achievements := v_achievements || '{"name": "Primeira Venda", "icon": "🎯"}'::jsonb; END IF;
  IF v_deals_won >= 10 THEN v_achievements := v_achievements || '{"name": "Vendedor Bronze", "icon": "🥉"}'::jsonb; END IF;
  IF v_deals_won >= 50 THEN v_achievements := v_achievements || '{"name": "Vendedor Prata", "icon": "🥈"}'::jsonb; END IF;
  IF v_deals_won >= 100 THEN v_achievements := v_achievements || '{"name": "Vendedor Ouro", "icon": "🥇"}'::jsonb; END IF;
  
  -- Conquistas de receita
  IF v_revenue >= 10000 THEN v_achievements := v_achievements || '{"name": "R$ 10K Club", "icon": "💰"}'::jsonb; END IF;
  IF v_revenue >= 100000 THEN v_achievements := v_achievements || '{"name": "R$ 100K Club", "icon": "💎"}'::jsonb; END IF;
  IF v_revenue >= 1000000 THEN v_achievements := v_achievements || '{"name": "Milionário", "icon": "👑"}'::jsonb; END IF;
  
  -- Conquistas de interações
  IF v_interactions >= 100 THEN v_achievements := v_achievements || '{"name": "Comunicador", "icon": "💬"}'::jsonb; END IF;
  IF v_interactions >= 1000 THEN v_achievements := v_achievements || '{"name": "Super Comunicador", "icon": "🗣️"}'::jsonb; END IF;
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'total_achievements', jsonb_array_length(v_achievements),
    'achievements', v_achievements,
    'stats', jsonb_build_object('deals_won', v_deals_won, 'revenue', v_revenue, 'interactions', v_interactions)
  );
END;
$function$
