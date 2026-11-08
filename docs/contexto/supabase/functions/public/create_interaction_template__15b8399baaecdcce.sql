CREATE OR REPLACE FUNCTION public.create_interaction_template(p_name text, p_type text, p_subject text DEFAULT NULL::text, p_content text DEFAULT NULL::text, p_tags text[] DEFAULT ARRAY[]::text[], p_is_public boolean DEFAULT false, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO interaction_templates (name, type, subject, content, tags, is_public, user_id)
  VALUES (p_name, p_type, p_subject, p_content, p_tags, p_is_public, p_user_id)
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS interaction_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    subject text,
    content text,
    tags text[] DEFAULT ARRAY[]::text[],
    is_public boolean DEFAULT false,
    user_id uuid REFERENCES profiles(id),
    usage_count int DEFAULT 0,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  
  INSERT INTO interaction_templates (name, type, subject, content, tags, is_public, user_id)
  VALUES (p_name, p_type, p_subject, p_content, p_tags, p_is_public, p_user_id)
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
END;
$function$
