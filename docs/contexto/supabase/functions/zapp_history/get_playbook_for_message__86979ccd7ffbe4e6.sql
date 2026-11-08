CREATE OR REPLACE FUNCTION zapp_history.get_playbook_for_message(p_message_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_msg zapp_history.messages%ROWTYPE;
  v_playbook zapp_history.disc_playbook%ROWTYPE;
BEGIN
  SELECT * INTO v_msg FROM zapp_history.messages WHERE id = p_message_id;
  IF NOT FOUND OR v_msg.disc_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Mensagem sem perfil DISC');
  END IF;

  SELECT * INTO v_playbook FROM zapp_history.disc_playbook WHERE profile = v_msg.disc_profile->>'profile';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Playbook não encontrado para perfil ' || (v_msg.disc_profile->>'profile'));
  END IF;

  RETURN jsonb_build_object(
    'message_id', v_msg.id,
    'perfil_detectado', v_msg.disc_profile,
    'tom_comunicacao', v_msg.communication_tone->>'tone',
    'etapa_funil', v_msg.funnel_stage,
    'journey_stage', v_msg.journey_stage,
    'lead_score', v_msg.lead_score,
    'playbook', jsonb_build_object(
      'abordagem', v_playbook.abordagem,
      'o_que_fazer', v_playbook.o_que_fazer,
      'o_que_evitar', v_playbook.o_que_evitar,
      'gatilhos_eficazes', v_playbook.gatilhos_eficazes,
      'exemplo_resposta', v_playbook.exemplo_resposta
    )
  );
END;
$function$
