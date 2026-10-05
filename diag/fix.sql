-- Restaura as escritas em contacts, companies, competitors e interactions.
-- 1) Os gatilhos de versão (optimistic locking) exigem a coluna version.
-- 2) Os gatilhos de auditoria gravam os dois formatos de public.audit_log:
--    table_name/record_id (NOT NULL em produção) e entity_type/entity_id (cadeia limpa).

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;

-- 3) trg_competitors_updated exige competitors.updated_at.
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 4) interactions.contact_id é opcional; a auditoria de interações não pode exigi-lo.
ALTER TABLE public.interactions_audit ALTER COLUMN contact_id DROP NOT NULL;

ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS record_id text;

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, entity_type, entity_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, entity_type, entity_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::text, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, record_id, entity_type, entity_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id::text, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_contact_tag_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed boolean := false;
BEGIN
  IF coalesce(old.hobbies, '{}') IS DISTINCT FROM coalesce(new.hobbies, '{}') THEN
    changed := true;
  END IF;
  IF coalesce(old.interests, '{}') IS DISTINCT FROM coalesce(new.interests, '{}') THEN
    changed := true;
  END IF;
  IF changed THEN
    INSERT INTO public.audit_log (table_name, record_id, entity_type, entity_id, action, old_data, new_data, user_id)
    VALUES (
      TG_TABLE_NAME,
      new.id::text,
      'contact_tags',
      new.id,
      'UPDATE',
      jsonb_build_object(
        'hobbies', to_jsonb(coalesce(old.hobbies, '{}'::text[])),
        'interests', to_jsonb(coalesce(old.interests, '{}'::text[]))
      ),
      jsonb_build_object(
        'hobbies', to_jsonb(coalesce(new.hobbies, '{}'::text[])),
        'interests', to_jsonb(coalesce(new.interests, '{}'::text[]))
      ),
      coalesce(auth.uid(), new.user_id)
    );
  END IF;
  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_trigger_fn() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_contact_tag_changes() FROM authenticated, anon, PUBLIC;
