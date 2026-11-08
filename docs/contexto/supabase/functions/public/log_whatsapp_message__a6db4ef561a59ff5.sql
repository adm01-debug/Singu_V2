CREATE OR REPLACE FUNCTION public.log_whatsapp_message(p_company_id uuid, p_direction text, p_content text, p_contact_id uuid DEFAULT NULL::uuid, p_message_type text DEFAULT 'text'::text, p_whatsapp_id text DEFAULT NULL::text, p_media_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_user_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  SELECT user_id INTO v_user_id FROM companies WHERE id = p_company_id;
  
  INSERT INTO whatsapp_messages (company_id, contact_id, direction, message_type, content, media_url, whatsapp_id, sent_at)
  VALUES (p_company_id, p_contact_id, p_direction, p_message_type, p_content, p_media_url, p_whatsapp_id, NOW())
  RETURNING id INTO v_id;
  
  -- Criar interação automaticamente
  INSERT INTO interactions (company_id, contact_id, user_id, type, channel, direction, resumo, content, data_interacao)
  VALUES (p_company_id, p_contact_id, v_user_id, 'whatsapp', 'whatsapp', p_direction, LEFT(p_content, 200), p_content, NOW());
  
  RETURN v_id;
END;
$function$
