CREATE OR REPLACE FUNCTION public.attach_document(p_entity_type text, p_entity_id uuid, p_file_name text, p_file_url text, p_file_type text DEFAULT 'document'::text, p_file_size integer DEFAULT NULL::integer, p_description text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doc_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO documents (entity_type, entity_id, file_name, file_url, file_type, file_size, description, user_id)
  VALUES (p_entity_type, p_entity_id, p_file_name, p_file_url, p_file_type, p_file_size, p_description, p_user_id)
  RETURNING id INTO v_doc_id;
  
  RETURN v_doc_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text DEFAULT 'document',
    file_size int,
    description text,
    user_id uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
  
  INSERT INTO documents (entity_type, entity_id, file_name, file_url, file_type, file_size, description, user_id)
  VALUES (p_entity_type, p_entity_id, p_file_name, p_file_url, p_file_type, p_file_size, p_description, p_user_id)
  RETURNING id INTO v_doc_id;
  
  RETURN v_doc_id;
END;
$function$
