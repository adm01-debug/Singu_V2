CREATE OR REPLACE FUNCTION public.audit_connection_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_user uuid;
BEGIN
  v_user := COALESCE(auth.uid(), NEW.created_by, OLD.created_by);

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  END IF;

  -- Mascarar campos sensíveis
  IF v_old IS NOT NULL THEN
    IF v_old ? 'config' THEN v_old := jsonb_set(v_old, '{config}', '"***masked***"'::jsonb); END IF;
    IF v_old ? 'encrypted_config' THEN v_old := v_old - 'encrypted_config'; END IF;
    IF v_old ? 'webhook_secret' AND v_old->>'webhook_secret' IS NOT NULL THEN
      v_old := jsonb_set(v_old, '{webhook_secret}', '"***masked***"'::jsonb);
    END IF;
    IF v_old ? 'token' THEN v_old := jsonb_set(v_old, '{token}', '"***masked***"'::jsonb); END IF;
  END IF;
  IF v_new IS NOT NULL THEN
    IF v_new ? 'config' THEN v_new := jsonb_set(v_new, '{config}', '"***masked***"'::jsonb); END IF;
    IF v_new ? 'encrypted_config' THEN v_new := v_new - 'encrypted_config'; END IF;
    IF v_new ? 'webhook_secret' AND v_new->>'webhook_secret' IS NOT NULL THEN
      v_new := jsonb_set(v_new, '{webhook_secret}', '"***masked***"'::jsonb);
    END IF;
    IF v_new ? 'token' THEN v_new := jsonb_set(v_new, '{token}', '"***masked***"'::jsonb); END IF;
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    v_user,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$
