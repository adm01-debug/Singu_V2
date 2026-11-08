CREATE OR REPLACE FUNCTION public.get_favorite_companies(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(company_id uuid, trade_name text, segment text, status text, last_interaction timestamp with time zone, pending_followups bigint, added_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as trade_name,
    c.ramo_atividade as segment,
    c.status::text,
    (SELECT MAX(data_interacao) FROM interactions i WHERE i.company_id = c.id) as last_interaction,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id AND i.follow_up_date <= CURRENT_DATE AND i.follow_up_date IS NOT NULL) as pending_followups,
    f.created_at as added_at
  FROM favorites f
  JOIN companies c ON c.id = f.entity_id
  WHERE f.user_id = p_user_id
    AND f.entity_type = 'company'
  ORDER BY f.created_at DESC;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
