CREATE OR REPLACE FUNCTION zapp_history.trg_auto_enqueue_transcription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
BEGIN
  -- Apenas marca a request no log — download+transcribe é job do cron
  IF NEW.transcription_status = 'pending' THEN
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, status,
      payload_preview
    ) VALUES (
      'transcription', 'message_audio', NEW.message_id, 'enqueued',
      'duration=' || COALESCE(NEW.duration_seconds::text, 'null') ||
      's mime=' || COALESCE(NEW.mime_type, 'null')
    );
  END IF;
  RETURN NEW;
END;
$function$
