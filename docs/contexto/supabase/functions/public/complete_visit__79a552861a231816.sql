CREATE OR REPLACE FUNCTION public.complete_visit(p_visit_id uuid, p_completion_notes text DEFAULT NULL::text, p_create_interaction boolean DEFAULT true)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_visit record;
BEGIN
  PERFORM public.assert_visit_access(p_visit_id);
  SELECT * INTO v_visit FROM scheduled_visits WHERE id = p_visit_id;
  
  IF v_visit IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE scheduled_visits 
  SET status = 'completed', completed_at = NOW(), completion_notes = COALESCE(p_completion_notes, completion_notes)
  WHERE id = p_visit_id;
  
  IF p_create_interaction THEN
    INSERT INTO interactions (company_id, type, channel, direction, resumo, content, user_id, data_interacao)
    VALUES (
      v_visit.company_id, 
      'meeting',  -- tipo válido
      'presencial',
      'outbound',
      COALESCE(p_completion_notes, 'Visita realizada'), 
      COALESCE(p_completion_notes, 'Visita realizada'), 
      v_visit.user_id, 
      NOW()
    );
  END IF;
  
  RETURN true;
END;
$function$
