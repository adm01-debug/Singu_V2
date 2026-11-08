CREATE OR REPLACE FUNCTION public.generate_rapport_suggestions(p_user_id uuid, p_contact_id uuid)
 RETURNS TABLE(contact_id uuid, rapport_score integer, mirroring_tips text[], shared_interests jsonb, conversation_starters text[], topics_to_avoid text[])
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_rapport   INTEGER := 50;
  v_mirroring TEXT[]  := ARRAY[]::TEXT[];
  v_interests JSONB;
  v_starters  TEXT[]  := ARRAY[]::TEXT[];
  v_avoid     TEXT[]  := ARRAY[]::TEXT[];
  v_comm      RECORD;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  SELECT * INTO v_comm
  FROM contact_communication_style
  WHERE contact_communication_style.contact_id = p_contact_id
    AND is_current = true;

  IF v_comm.pace = 'fast' THEN
    v_mirroring := array_append(v_mirroring, 'Fale de forma rápida e objetiva');
  ELSIF v_comm.pace = 'slow' THEN
    v_mirroring := array_append(v_mirroring, 'Diminua o ritmo, dê tempo');
  END IF;

  IF v_comm.tone = 'formal' THEN
    v_mirroring := array_append(v_mirroring, 'Use linguagem formal');
  ELSIF v_comm.tone = 'casual' THEN
    v_mirroring := array_append(v_mirroring, 'Pode usar tom descontraído');
  END IF;

  IF v_comm.prefers_data    THEN v_mirroring := array_append(v_mirroring, 'Traga dados e números'); END IF;
  IF v_comm.prefers_stories THEN v_mirroring := array_append(v_mirroring, 'Use histórias e cases'); END IF;

  SELECT jsonb_agg(jsonb_build_object(
      'category', si.interest_category,
      'name',     si.interest_name,
      'value',    si.rapport_value
  )) INTO v_interests
  FROM shared_interests si
  WHERE si.contact_id = p_contact_id AND si.is_active = true;

  SELECT array_agg(DISTINCT unnest) INTO v_starters
  FROM (
      SELECT unnest(si.conversation_starters)
      FROM shared_interests si
      WHERE si.contact_id = p_contact_id AND si.is_active = true LIMIT 10
  ) AS starters;

  v_avoid := COALESCE(v_comm.disengagement_triggers, ARRAY[]::TEXT[]);

  SELECT COALESCE(rsh.rapport_score, 50) INTO v_rapport
  FROM rapport_score_history rsh
  WHERE rsh.contact_id = p_contact_id AND rsh.is_current = true;

  IF array_length(v_mirroring, 1) IS NULL THEN
    v_mirroring := ARRAY['Observe e espelhe o ritmo'];
  END IF;
  IF array_length(v_starters, 1) IS NULL THEN
    v_starters := ARRAY['Pergunte sobre o dia/semana'];
  END IF;

  RETURN QUERY
    SELECT p_contact_id, v_rapport, v_mirroring,
           COALESCE(v_interests, '[]'::JSONB),
           COALESCE(v_starters, ARRAY[]::TEXT[]),
           COALESCE(v_avoid,    ARRAY[]::TEXT[]);
END;
$function$
