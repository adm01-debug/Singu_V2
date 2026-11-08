CREATE OR REPLACE FUNCTION zapp_history.bump_conversation_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
BEGIN
  UPDATE zapp_history.conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = CASE
        WHEN NEW.content IS NOT NULL THEN LEFT(NEW.content, 200)
        WHEN NEW.message_type = 'image' THEN '[imagem]'
        WHEN NEW.message_type = 'video' THEN '[vídeo]'
        WHEN NEW.message_type = 'audio' THEN '[áudio]'
        WHEN NEW.message_type = 'document' THEN '[documento]'
        WHEN NEW.message_type = 'sticker' THEN '[figurinha]'
        ELSE '[' || NEW.message_type || ']'
      END,
      last_message_type = NEW.message_type,
      total_messages = total_messages + 1,
      unread_count = CASE
        WHEN NEW.direction = 'inbound' THEN unread_count + 1
        ELSE unread_count
      END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
