CREATE OR REPLACE FUNCTION public.singu_audit_trigger_fn()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Tenta extrair user_id do registro
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_user_id := OLD.user_id;
    ELSE
      v_user_id := NEW.user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'::uuid));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$
