CREATE OR REPLACE FUNCTION public.check_relationship_consistency(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact public.contacts%ROWTYPE;
  v_count bigint;
  v_last timestamptz;
  v_issues jsonb := '[]'::jsonb;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('consistent', false, 'issues', jsonb_build_array(
      jsonb_build_object('type', 'contact', 'expected', 'encontrado', 'actual', 'não encontrado')));
  END IF;
  SELECT count(*), max(created_at) INTO v_count, v_last
    FROM public.interactions WHERE contact_id = p_contact_id;
  IF v_contact.last_interaction_at IS DISTINCT FROM v_last THEN
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('type', 'last_interaction_at',
      'expected', v_last, 'actual', v_contact.last_interaction_at));
  END IF;
  IF v_contact.relationship_score < 0 OR v_contact.relationship_score > 100 THEN
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('type', 'relationship_score',
      'expected', '0 a 100', 'actual', v_contact.relationship_score));
  END IF;
  RETURN jsonb_build_object('contact_id', p_contact_id, 'consistent', jsonb_array_length(v_issues) = 0,
    'issues', v_issues, 'interactions_count', v_count, 'last_interaction_at', v_last, 'timestamp', now());
END;
$function$
