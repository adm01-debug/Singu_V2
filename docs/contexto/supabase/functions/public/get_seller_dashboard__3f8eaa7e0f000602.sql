CREATE OR REPLACE FUNCTION public.get_seller_dashboard(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    -- KPIs do mês
    'monthly_kpis', jsonb_build_object(
      'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= DATE_TRUNC('month', CURRENT_DATE)),
      'new_companies', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND created_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'deals_won', (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'deals_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    
    -- Pipeline atual
    'pipeline', (
      SELECT jsonb_agg(jsonb_build_object('stage', stage, 'count', cnt, 'value', val))
      FROM (
        SELECT pipeline_stage as stage, COUNT(*) as cnt, COALESCE(SUM(valor), 0) as val
        FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido')
        GROUP BY pipeline_stage
      ) t
    ),
    
    -- Ações pendentes
    'pending_actions', jsonb_build_object(
      'follow_ups', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND follow_up_date <= CURRENT_DATE AND COALESCE(followup_concluido, false) = false),
      'reminders', (SELECT COUNT(*) FROM reminders WHERE user_id = p_user_id AND reminder_date <= NOW() AND is_completed = false),
      'visits', (SELECT COUNT(*) FROM scheduled_visits WHERE user_id = p_user_id AND visit_date::date <= CURRENT_DATE AND status = 'pending'),
      'cadence_actions', (SELECT COUNT(*) FROM cadence_enrollments WHERE user_id = p_user_id AND status = 'active' AND next_action_at <= NOW())
    ),
    
    -- Top leads (por score)
    'top_leads', (
      SELECT jsonb_agg(jsonb_build_object('id', id, 'name', COALESCE(nome_fantasia, nome_crm), 'score', lead_score))
      FROM (SELECT id, nome_fantasia, nome_crm, lead_score FROM companies WHERE user_id = p_user_id AND deleted_at IS NULL ORDER BY lead_score DESC NULLS LAST LIMIT 5) t
    ),
    
    -- Badges
    'badges_count', (SELECT COUNT(*) FROM user_badges WHERE user_id = p_user_id),
    'total_points', (SELECT COALESCE(SUM(b.points), 0) FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = p_user_id),
    
    -- Notificações não lidas
    'unread_notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = p_user_id AND is_read = false),
    
    'updated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
