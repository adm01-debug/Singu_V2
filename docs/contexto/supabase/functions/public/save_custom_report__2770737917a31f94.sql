CREATE OR REPLACE FUNCTION public.save_custom_report(p_name text, p_description text DEFAULT NULL::text, p_report_type text DEFAULT 'table'::text, p_query_config jsonb DEFAULT '{}'::jsonb, p_columns jsonb DEFAULT '[]'::jsonb, p_is_public boolean DEFAULT false, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_report_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO custom_reports (name, description, report_type, query_config, columns, is_public, user_id)
  VALUES (p_name, p_description, p_report_type, p_query_config, p_columns, p_is_public, p_user_id)
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS custom_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    report_type text DEFAULT 'table',
    query_config jsonb DEFAULT '{}'::jsonb,
    columns jsonb DEFAULT '[]'::jsonb,
    is_public boolean DEFAULT false,
    user_id uuid REFERENCES profiles(id),
    run_count int DEFAULT 0,
    last_run_at timestamptz,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  
  INSERT INTO custom_reports (name, description, report_type, query_config, columns, is_public, user_id)
  VALUES (p_name, p_description, p_report_type, p_query_config, p_columns, p_is_public, p_user_id)
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$function$
