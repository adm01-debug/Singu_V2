CREATE OR REPLACE FUNCTION public.assert_note_access(p_note_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_note_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM quick_notes WHERE id = p_note_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: note % does not belong to the current user', p_note_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$function$
