CREATE OR REPLACE FUNCTION public.get_relationship_health(p_contact_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'contact_id', p_contact_id,
    'relationship_score', c.relationship_score,
    'sentiment', c.sentiment,
    'relationship_stage', c.relationship_stage,
    'last_interaction', (
      SELECT i.data_interacao FROM public.interactions i
      WHERE (i.contact_id = p_contact_id) AND i.user_id = p_user_id
      ORDER BY i.data_interacao DESC LIMIT 1
    ),
    'pending_alerts', (
      SELECT COUNT(*) FROM public.health_alerts ha
      WHERE ha.contact_id = p_contact_id AND ha.user_id = p_user_id AND ha.dismissed = false
    ),
    'cadence', (
      SELECT row_to_json(cc.*) FROM public.contact_cadence cc
      WHERE cc.contact_id = p_contact_id AND cc.user_id = p_user_id
      LIMIT 1
    )
  ) INTO result
  FROM public.contacts c
  WHERE c.id = p_contact_id AND c.user_id = p_user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$
