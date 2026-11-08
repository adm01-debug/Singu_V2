CREATE OR REPLACE FUNCTION zapp_history.get_contact_messages_for_summary(p_contact_id uuid, p_date date, p_timezone text DEFAULT 'America/Sao_Paulo'::text)
 RETURNS TABLE(message_id uuid, direction text, content text, audio_transcription text, media_caption text, links text[], sent_at timestamp with time zone, agent_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  v_start := (p_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_timezone;
  v_end := (p_date::TEXT || ' 23:59:59.999')::TIMESTAMP AT TIME ZONE p_timezone;

  RETURN QUERY
  SELECT
    m.id,
    m.direction,
    m.content,
    ma.transcription,
    mm.caption,
    ARRAY(SELECT url FROM zapp_history.message_links ml WHERE ml.message_id = m.id),
    m.created_at,
    COALESCE(p.full_name, 'sistema')
  FROM zapp_history.messages m
  LEFT JOIN zapp_history.message_audio ma ON ma.message_id = m.id
  LEFT JOIN zapp_history.message_media mm ON mm.message_id = m.id
  LEFT JOIN public.profiles p ON p.id = m.sent_by_user_id
  WHERE m.contact_id = p_contact_id
    AND m.created_at >= v_start
    AND m.created_at <= v_end
  ORDER BY m.created_at ASC;
END;
$function$
