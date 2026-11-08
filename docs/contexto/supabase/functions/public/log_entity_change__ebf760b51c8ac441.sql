CREATE OR REPLACE FUNCTION public.log_entity_change(p_entity_type text, p_entity_id uuid, p_action text, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb, p_changed_fields text[] DEFAULT NULL::text[], p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO entity_change_logs (entity_type, entity_id, action, old_data, new_data, changed_fields, user_id)
  VALUES (p_entity_type, p_entity_id, p_action, p_old_data, p_new_data, p_changed_fields, p_user_id)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS entity_change_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    user_id uuid,
    created_at timestamptz DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_change_logs_entity ON entity_change_logs(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_change_logs_date ON entity_change_logs(created_at);
  
  INSERT INTO entity_change_logs (entity_type, entity_id, action, old_data, new_data, changed_fields, user_id)
  VALUES (p_entity_type, p_entity_id, p_action, p_old_data, p_new_data, p_changed_fields, p_user_id)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$
