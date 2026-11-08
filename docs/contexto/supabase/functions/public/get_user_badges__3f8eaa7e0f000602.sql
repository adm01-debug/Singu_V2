CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id uuid)
 RETURNS TABLE(badge_id uuid, badge_code text, badge_name text, badge_description text, badge_icon text, badge_category text, badge_points integer, earned_at timestamp with time zone, is_recent boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    b.id as badge_id,
    b.code as badge_code,
    b.name as badge_name,
    b.description as badge_description,
    b.icon as badge_icon,
    b.category as badge_category,
    COALESCE(b.points, 0) as badge_points,
    ub.earned_at,
    (ub.earned_at >= CURRENT_DATE - 7) as is_recent
  FROM user_badges ub
  JOIN badges b ON b.id = ub.badge_id
  WHERE ub.user_id = p_user_id
  ORDER BY ub.earned_at DESC;
END;
$function$
