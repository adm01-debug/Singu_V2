-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417004407
-- nome:   singu_fix_audit_trigger_fn_dual_cols

-- ============================================================================
-- FIX crítico: audit_trigger_fn tem que popular AMBOS os pares de colunas:
-- - table_name/record_id (do CRM, NOT NULL)  
-- - entity_type/entity_id (do SINGU, NULL permitido mas usado pela app)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      table_name, record_id, action,         -- campos CRM (NOT NULL)
      entity_type, entity_id,                -- campos SINGU
      new_data, user_id
    )
    VALUES (
      TG_TABLE_NAME, NEW.id::text, 'INSERT',
      TG_TABLE_NAME, NEW.id,
      to_jsonb(NEW),
      COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      table_name, record_id, action,
      entity_type, entity_id,
      old_data, new_data, user_id
    )
    VALUES (
      TG_TABLE_NAME, NEW.id::text, 'UPDATE',
      TG_TABLE_NAME, NEW.id,
      to_jsonb(OLD), to_jsonb(NEW),
      COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      table_name, record_id, action,
      entity_type, entity_id,
      old_data, user_id
    )
    VALUES (
      TG_TABLE_NAME, OLD.id::text, 'DELETE',
      TG_TABLE_NAME, OLD.id,
      to_jsonb(OLD),
      COALESCE(OLD.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.audit_trigger_fn() IS 'CRM+SINGU: popula table_name/record_id (CRM NOT NULL) E entity_type/entity_id (SINGU) simultaneamente. user_id tem fallback para 00000000... quando NULL.';
