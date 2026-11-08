CREATE OR REPLACE FUNCTION public.get_whatsapp_stats(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'total_messages', COUNT(*),
      'sent', COUNT(*) FILTER (WHERE direction = 'outbound'),
      'received', COUNT(*) FILTER (WHERE direction = 'inbound'),
      'delivered_rate', ROUND(COUNT(*) FILTER (WHERE status IN ('delivered', 'read'))::numeric / NULLIF(COUNT(*) FILTER (WHERE direction = 'outbound'), 0) * 100, 2),
      'read_rate', ROUND(COUNT(*) FILTER (WHERE status = 'read')::numeric / NULLIF(COUNT(*) FILTER (WHERE direction = 'outbound'), 0) * 100, 2),
      'by_type', jsonb_build_object(
        'text', COUNT(*) FILTER (WHERE message_type = 'text'),
        'image', COUNT(*) FILTER (WHERE message_type = 'image'),
        'audio', COUNT(*) FILTER (WHERE message_type = 'audio'),
        'document', COUNT(*) FILTER (WHERE message_type = 'document')
      ),
      'period_days', p_days
    )
    FROM whatsapp_messages wm
    JOIN companies c ON c.id = wm.company_id
    WHERE wm.created_at >= NOW() - (p_days || ' days')::interval
      AND (p_user_id IS NULL OR c.user_id = p_user_id)
  );
END;
$function$
