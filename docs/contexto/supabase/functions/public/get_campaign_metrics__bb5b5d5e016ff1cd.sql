CREATE OR REPLACE FUNCTION public.get_campaign_metrics(p_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'campaign_id', c.id,
    'name', c.name,
    'status', c.status,
    'total_members', COUNT(cm.id),
    'sent', COUNT(cm.id) FILTER (WHERE cm.sent_at IS NOT NULL),
    'delivered', COUNT(cm.id) FILTER (WHERE cm.status != 'bounced' AND cm.sent_at IS NOT NULL),
    'opened', COUNT(cm.id) FILTER (WHERE cm.opened_at IS NOT NULL),
    'clicked', COUNT(cm.id) FILTER (WHERE cm.clicked_at IS NOT NULL),
    'converted', COUNT(cm.id) FILTER (WHERE cm.converted_at IS NOT NULL),
    'bounced', COUNT(cm.id) FILTER (WHERE cm.status = 'bounced'),
    'open_rate', ROUND(COUNT(cm.id) FILTER (WHERE cm.opened_at IS NOT NULL)::numeric / NULLIF(COUNT(cm.id) FILTER (WHERE cm.sent_at IS NOT NULL), 0) * 100, 1),
    'click_rate', ROUND(COUNT(cm.id) FILTER (WHERE cm.clicked_at IS NOT NULL)::numeric / NULLIF(COUNT(cm.id) FILTER (WHERE cm.opened_at IS NOT NULL), 0) * 100, 1),
    'conversion_rate', ROUND(COUNT(cm.id) FILTER (WHERE cm.converted_at IS NOT NULL)::numeric / NULLIF(COUNT(cm.id), 0) * 100, 1)
  ) INTO v_result
  FROM campaigns c
  LEFT JOIN campaign_members cm ON cm.campaign_id = c.id
  WHERE c.id = p_campaign_id
  GROUP BY c.id;
  
  RETURN v_result;
END;
$function$
