CREATE OR REPLACE FUNCTION public.get_workflow_pipeline(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'new_leads', (
      SELECT COUNT(*) FROM companies c
      WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
        AND c.status = 'ativo'
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)
    ),
    'active', (
      SELECT COUNT(*) FROM companies c
      WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
        AND c.status = 'ativo'
        AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= NOW() - interval '30 days')
    ),
    'dormant', (
      SELECT COUNT(*) FROM companies c
      WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
        AND c.status = 'ativo'
        AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= NOW() - interval '30 days')
    ),
    'at_risk', (
      SELECT COUNT(DISTINCT c.id) FROM companies c
      JOIN interactions i ON i.company_id = c.id
      WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
        AND c.status = 'ativo'
        AND i.sentiment = 'negative'
        AND i.created_at >= NOW() - interval '14 days'
    ),
    'pending_followup', (
      SELECT COUNT(DISTINCT c.id) FROM companies c
      JOIN interactions i ON i.company_id = c.id
      WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
        AND c.status = 'ativo'
        AND i.follow_up_date <= CURRENT_DATE
        AND i.follow_up_date IS NOT NULL
    ),
    'inactive', (
      SELECT COUNT(*) FROM companies WHERE (p_user_id IS NULL OR user_id = p_user_id) AND status = 'inativo'
    )
  );
END;
$function$
