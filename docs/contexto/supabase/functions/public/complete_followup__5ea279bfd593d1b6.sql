CREATE OR REPLACE FUNCTION public.complete_followup(p_interaction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_interaction_access(p_interaction_id);
  UPDATE interactions SET followup_concluido = true, follow_up_required = false, updated_at = now()
  WHERE id = p_interaction_id
    AND (requer_followup = true OR follow_up_required = true)
    AND COALESCE(followup_concluido, false) = false;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    SELECT jsonb_build_object('success', false, 'message', 'Followup não encontrado ou já concluído') INTO result;
  ELSE
    SELECT jsonb_build_object('success', true, 'interaction_id', p_interaction_id, 'message', 'Followup concluído') INTO result;
  END IF;

  RETURN result;
END;
$function$
