CREATE OR REPLACE FUNCTION public.add_quick_note(p_company_id uuid, p_content text, p_note_type text DEFAULT 'general'::text, p_is_pinned boolean DEFAULT false, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_note_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO quick_notes (company_id, user_id, content, note_type, is_pinned)
  VALUES (p_company_id, p_user_id, p_content, p_note_type, p_is_pinned)
  RETURNING id INTO v_note_id;
  
  RETURN v_note_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS quick_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id),
    user_id uuid REFERENCES profiles(id),
    content text NOT NULL,
    note_type text DEFAULT 'general',
    is_pinned boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_quick_notes_company ON quick_notes(company_id);
  
  INSERT INTO quick_notes (company_id, user_id, content, note_type, is_pinned)
  VALUES (p_company_id, p_user_id, p_content, p_note_type, p_is_pinned)
  RETURNING id INTO v_note_id;
  
  RETURN v_note_id;
END;
$function$
