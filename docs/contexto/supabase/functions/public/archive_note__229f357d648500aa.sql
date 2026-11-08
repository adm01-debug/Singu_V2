CREATE OR REPLACE FUNCTION public.archive_note(p_note_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_note_access(p_note_id);
  UPDATE quick_notes 
  SET is_archived = true, is_pinned = false, updated_at = NOW()
  WHERE id = p_note_id;
  
  RETURN FOUND;
END;
$function$
