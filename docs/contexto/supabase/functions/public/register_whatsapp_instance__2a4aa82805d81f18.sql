CREATE OR REPLACE FUNCTION public.register_whatsapp_instance(p_instance_name text, p_phone_number text, p_api_url text, p_api_key text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_instance_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO whatsapp_instances (instance_name, phone_number, api_url, api_key, user_id, status)
  VALUES (p_instance_name, p_phone_number, p_api_url, p_api_key, p_user_id, 'pending')
  RETURNING id INTO v_instance_id;
  
  RETURN v_instance_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name text NOT NULL,
    phone_number text,
    api_url text NOT NULL,
    api_key text NOT NULL,
    status text DEFAULT 'pending', -- 'pending', 'connected', 'disconnected', 'error'
    user_id uuid REFERENCES profiles(id),
    last_connected_at timestamptz,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  
  INSERT INTO whatsapp_instances (instance_name, phone_number, api_url, api_key, user_id, status)
  VALUES (p_instance_name, p_phone_number, p_api_url, p_api_key, p_user_id, 'pending')
  RETURNING id INTO v_instance_id;
  
  RETURN v_instance_id;
END;
$function$
