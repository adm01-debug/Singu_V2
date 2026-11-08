CREATE OR REPLACE FUNCTION public.toggle_note_pin(p_note_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_status boolean;
BEGIN
  PERFORM public.assert_note_access(p_note_id);
  UPDATE quick_notes 
  SET is_pinned = NOT is_pinned, updated_at = NOW()
  WHERE id = p_note_id
  RETURNING is_pinned INTO v_new_status;
  
  RETURN v_new_status;
END;
$function$
