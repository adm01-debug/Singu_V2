CREATE OR REPLACE FUNCTION public.get_contact_intelligence(p_contact_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'disc_profile', (SELECT row_to_json(d.*) FROM public.disc_analysis_history d WHERE d.contact_id = p_contact_id AND d.user_id = p_user_id ORDER BY d.analyzed_at DESC LIMIT 1),
    'eq_profile', (SELECT row_to_json(e.*) FROM public.eq_analysis_history e WHERE e.contact_id = p_contact_id AND e.user_id = p_user_id ORDER BY e.analyzed_at DESC LIMIT 1),
    'cognitive_biases', (SELECT row_to_json(cb.*) FROM public.cognitive_bias_history cb WHERE cb.contact_id = p_contact_id AND cb.user_id = p_user_id ORDER BY cb.analyzed_at DESC LIMIT 1),
    'metaprograms', (SELECT row_to_json(m.*) FROM public.metaprogram_analysis m WHERE m.contact_id = p_contact_id AND m.user_id = p_user_id ORDER BY m.created_at DESC LIMIT 1),
    'emotional_state', (SELECT row_to_json(es.*) FROM public.emotional_states_history es WHERE es.contact_id = p_contact_id AND es.user_id = p_user_id ORDER BY es.created_at DESC LIMIT 1),
    'hidden_objections', (SELECT COALESCE(json_agg(row_to_json(ho.*)), '[]'::json) FROM public.hidden_objections ho WHERE ho.contact_id = p_contact_id AND ho.user_id = p_user_id AND ho.resolved = false),
    'active_insights', (SELECT COALESCE(json_agg(row_to_json(ins.*)), '[]'::json) FROM public.insights ins WHERE ins.contact_id = p_contact_id AND ins.user_id = p_user_id AND ins.dismissed = false),
    'values', (SELECT COALESCE(json_agg(row_to_json(cv.*) ORDER BY cv.importance DESC), '[]'::json) FROM public.client_values cv WHERE cv.contact_id = p_contact_id AND cv.user_id = p_user_id),
    'decision_criteria', (SELECT COALESCE(json_agg(row_to_json(dc.*) ORDER BY dc.priority DESC), '[]'::json) FROM public.decision_criteria dc WHERE dc.contact_id = p_contact_id AND dc.user_id = p_user_id)
  ) INTO result;
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$
