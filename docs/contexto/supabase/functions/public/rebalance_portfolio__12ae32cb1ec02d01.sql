CREATE OR REPLACE FUNCTION public.rebalance_portfolio()
 RETURNS TABLE(user_name text, before_count integer, after_count integer, change integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_avg int; v_user RECORD;
BEGIN
  SELECT AVG(cnt)::int INTO v_avg FROM (SELECT COUNT(*)::int as cnt FROM companies WHERE user_id IS NOT NULL AND deleted_at IS NULL GROUP BY user_id) sub;
  
  FOR v_user IN SELECT p.id, COALESCE(p.full_name, p.email) as name, (SELECT COUNT(*)::int FROM companies WHERE user_id = p.id AND deleted_at IS NULL) as cnt FROM profiles p WHERE p.is_active = true LOOP
    user_name := v_user.name;
    before_count := v_user.cnt;
    after_count := v_user.cnt; -- Mantém (só retorna análise)
    change := v_avg - v_user.cnt;
    RETURN NEXT;
  END LOOP;
END;
$function$
