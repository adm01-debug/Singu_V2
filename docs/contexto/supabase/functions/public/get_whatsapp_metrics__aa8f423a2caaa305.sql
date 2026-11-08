CREATE OR REPLACE FUNCTION public.get_whatsapp_metrics(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_messages', (SELECT COUNT(*) FROM whatsapp_messages WHERE sent_at >= NOW() - (p_days || ' days')::interval),
    'inbound', (SELECT COUNT(*) FROM whatsapp_messages WHERE direction = 'inbound' AND sent_at >= NOW() - (p_days || ' days')::interval),
    'outbound', (SELECT COUNT(*) FROM whatsapp_messages WHERE direction = 'outbound' AND sent_at >= NOW() - (p_days || ' days')::interval),
    'unique_companies', (SELECT COUNT(DISTINCT company_id) FROM whatsapp_messages WHERE sent_at >= NOW() - (p_days || ' days')::interval)
  );
END;
$function$
