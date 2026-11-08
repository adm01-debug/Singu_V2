CREATE OR REPLACE FUNCTION public.log_whatsapp_message(p_company_id uuid, p_direction text, p_content text, p_contact_id uuid DEFAULT NULL::uuid, p_phone text DEFAULT NULL::text, p_media_url text DEFAULT NULL::text, p_message_id text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interaction_id UUID;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO interactions (
    id, company_id, contact_id, channel, direction, 
    type, content, conteudo, status, 
    external_id, source_system, user_id, created_at
  ) VALUES (
    gen_random_uuid(), p_company_id, p_contact_id, 'whatsapp', p_direction,
    'mensagem', p_content, p_content, 'concluido',
    p_message_id, 'evolution_api', p_user_id, NOW()
  )
  RETURNING id INTO v_interaction_id;
  
  -- Atualiza última interação da empresa
  UPDATE companies SET updated_at = NOW() WHERE id = p_company_id;
  
  RETURN v_interaction_id;
END;
$function$
