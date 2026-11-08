CREATE OR REPLACE FUNCTION public.get_batch_next_actions(p_user_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, name text, action text, priority text, channel text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    (get_next_best_action(c.id)->>'action'),
    (get_next_best_action(c.id)->>'priority'),
    (get_next_best_action(c.id)->>'channel')
  FROM companies c WHERE c.user_id = p_user_id AND c.deleted_at IS NULL
  ORDER BY CASE (get_next_best_action(c.id)->>'priority') WHEN 'ALTA' THEN 1 WHEN 'MÉDIA' THEN 2 ELSE 3 END
  LIMIT p_limit;
$function$
