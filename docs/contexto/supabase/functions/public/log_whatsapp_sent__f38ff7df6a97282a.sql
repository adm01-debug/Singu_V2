CREATE OR REPLACE FUNCTION public.log_whatsapp_sent(p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_phone text DEFAULT NULL::text, p_message text DEFAULT NULL::text, p_instance_id uuid DEFAULT NULL::uuid, p_external_id text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interaction_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO interactions (
    company_id, contact_id, type, channel, resumo, content,
    user_id, data_interacao, metadata
  )
  VALUES (
    p_company_id, p_contact_id, 'whatsapp', 'whatsapp',
    COALESCE(p_message, 'Mensagem enviada via WhatsApp'),
    COALESCE(p_message, 'Mensagem enviada via WhatsApp'),
    p_user_id, NOW(),
    jsonb_build_object(
      'phone', p_phone,
      'instance_id', p_instance_id,
      'external_id', p_external_id,
      'direction', 'outbound'
    )
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$function$
