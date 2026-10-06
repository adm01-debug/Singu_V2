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
-- Gatilhos de auditoria também registram escritas sem usuário (importações, interações sem dono).
ALTER TABLE public.audit_log ALTER COLUMN user_id DROP NOT NULL;

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

-- 5) interactions.user_id também é opcional; a auditoria de interações não pode exigi-lo.
ALTER TABLE public.interactions_audit ALTER COLUMN user_id DROP NOT NULL;

-- 6) O score de relacionamento é calculado por calculate_relationship_metrics
--    (tr_update_contact_metrics); este gatilho mantém apenas sentimento e última interação,
--    gravando somente colunas existentes em contacts.
CREATE OR REPLACE FUNCTION public.update_contact_relationship_metrics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  last_interaction_date timestamptz;
  avg_sentiment text;
BEGIN
  IF NEW.contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT max(created_at)
  INTO last_interaction_date
  FROM public.interactions
  WHERE contact_id = NEW.contact_id;

  SELECT sentiment
  INTO avg_sentiment
  FROM (
    SELECT sentiment, count(*) AS cnt
    FROM public.interactions
    WHERE contact_id = NEW.contact_id
      AND sentiment IS NOT NULL
    GROUP BY sentiment
    ORDER BY cnt DESC, max(created_at) DESC
    LIMIT 1
  ) sub;

  UPDATE public.contacts
  SET
    sentiment = COALESCE(avg_sentiment, 'neutral'),
    last_interaction_at = last_interaction_date,
    updated_at = now()
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$$;

-- 7) A cadência ignora interações sem contato ou sem usuário (colunas NOT NULL em
--    contact_cadence) e usa a UNIQUE (user_id, contact_id) para um upsert atômico.
CREATE OR REPLACE FUNCTION public.sync_contact_last_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.contact_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.contact_cadence (contact_id, user_id, last_contact_at)
  VALUES (NEW.contact_id, NEW.user_id, NEW.created_at)
  ON CONFLICT (user_id, contact_id)
  DO UPDATE SET last_contact_at = EXCLUDED.last_contact_at;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_contact_relationship_metrics() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_contact_last_interaction() FROM authenticated, anon, PUBLIC;

-- 8) Interações importadas sem usuário não geram item no feed (activity_feed.user_id é NOT NULL).
CREATE OR REPLACE FUNCTION public.trigger_log_interaction_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_company_name text;
BEGIN
  IF TG_OP <> 'INSERT' OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(nome_fantasia, nome_crm, razao_social)
  INTO v_company_name
  FROM public.companies
  WHERE id = NEW.company_id;

  PERFORM public.log_activity(NEW.user_id, 'created', 'interaction', NEW.id, NEW.type,
    'Registrou ' || NEW.type || ' com ' || v_company_name);
  RETURN NEW;
END;
$$;

-- 9) audit_trigger_func identifica o registro pela chave primária, inclusive em tabelas
--    sem coluna id (oauth_tokens usa service), e não copia tokens OAuth para a auditoria.
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
  v_row jsonb := COALESCE(v_new, v_old);
  v_record_id text;
  changed_cols text[];
  col_name text;
BEGIN
  SELECT string_agg(v_row ->> a.attname, ',' ORDER BY array_position(i.indkey, a.attnum))
  INTO v_record_id
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
  WHERE i.indrelid = TG_RELID
    AND i.indisprimary;

  v_record_id := COALESCE(v_record_id, v_row ->> 'id', md5(v_row::text));

  IF TG_OP = 'UPDATE' THEN
    FOR col_name IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_old -> col_name IS DISTINCT FROM v_new -> col_name THEN
        changed_cols := array_append(changed_cols, col_name);
      END IF;
    END LOOP;
  END IF;

  v_old := v_old - ARRAY['access_token', 'refresh_token'];
  v_new := v_new - ARRAY['access_token', 'refresh_token'];

  INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_old, v_new, changed_cols, (SELECT auth.uid()));

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_log_interaction_activity() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM authenticated, anon, PUBLIC;

-- 10) O estágio automático só emite valores aceitos por contacts_relationship_stage_check
--     ('qualified' e 'lead' eram rejeitados e bloqueavam contatos com score entre 1 e 39).
CREATE OR REPLACE FUNCTION public.auto_update_relationship_stage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.relationship_stage := CASE
    WHEN NEW.relationship_score >= 80 THEN 'advocate'
    WHEN NEW.relationship_score >= 60 THEN 'customer'
    WHEN NEW.relationship_score >= 40 THEN 'opportunity'
    WHEN NEW.relationship_score >= 20 THEN 'qualified_lead'
    WHEN NEW.relationship_score >= 1 THEN 'prospect'
    ELSE COALESCE(NEW.relationship_stage, 'unknown')
  END;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_update_relationship_stage() FROM authenticated, anon, PUBLIC;
