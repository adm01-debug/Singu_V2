CREATE OR REPLACE FUNCTION public.log_whatsapp_message(p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_direction text DEFAULT 'outbound'::text, p_content text DEFAULT NULL::text, p_message_type text DEFAULT 'text'::text, p_whatsapp_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_interaction_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO whatsapp_messages (company_id, contact_id, direction, content, message_type, whatsapp_id, metadata)
  VALUES (p_company_id, p_contact_id, p_direction, p_content, p_message_type, p_whatsapp_id, p_metadata)
  RETURNING id INTO v_id;
  
  INSERT INTO interactions (company_id, contact_id, type, channel, direction, resumo, data_interacao, user_id)
  VALUES (p_company_id, p_contact_id, 'whatsapp', 'whatsapp', p_direction, LEFT(p_content, 200), NOW(), (SELECT user_id FROM companies WHERE id = p_company_id))
  RETURNING id INTO v_interaction_id;
  
  RETURN jsonb_build_object('success', true, 'message_id', v_id, 'interaction_id', v_interaction_id);
END;
$function$
