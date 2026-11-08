CREATE OR REPLACE FUNCTION public.get_template_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_templates', (SELECT COUNT(*) FROM message_templates WHERE is_active = true),
    'by_channel', (SELECT jsonb_object_agg(channel, cnt) FROM (SELECT channel, COUNT(*) as cnt FROM message_templates WHERE is_active = true GROUP BY channel) t),
    'most_used', (SELECT jsonb_agg(jsonb_build_object('name', name, 'use_count', use_count)) FROM (SELECT name, use_count FROM message_templates WHERE is_active = true ORDER BY use_count DESC LIMIT 5) t),
    'total_uses', (SELECT COALESCE(SUM(use_count), 0) FROM message_templates)
  );
END;
$function$
