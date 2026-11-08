CREATE OR REPLACE FUNCTION public.get_campaigns(p_status text DEFAULT NULL::text)
 RETURNS TABLE(campaign_id uuid, name text, campaign_type text, status text, members_count bigint, sent_count bigint, open_rate numeric, conversion_rate numeric, start_date date, end_date date)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name::text,
    c.type::text,
    c.status::text,
    COUNT(cm.id),
    COUNT(cm.id) FILTER (WHERE cm.status != 'pending'),
    ROUND(COUNT(cm.id) FILTER (WHERE cm.opened_at IS NOT NULL)::numeric / NULLIF(COUNT(cm.id) FILTER (WHERE cm.sent_at IS NOT NULL), 0) * 100, 1),
    ROUND(COUNT(cm.id) FILTER (WHERE cm.converted_at IS NOT NULL)::numeric / NULLIF(COUNT(cm.id), 0) * 100, 1),
    c.start_date,
    c.end_date
  FROM campaigns c
  LEFT JOIN campaign_members cm ON cm.campaign_id = c.id
  WHERE p_status IS NULL OR c.status = p_status
  GROUP BY c.id
  ORDER BY c.created_at DESC;
END;
$function$
