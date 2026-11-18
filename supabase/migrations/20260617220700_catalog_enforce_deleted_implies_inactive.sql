-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260617220700
-- nome:   catalog_enforce_deleted_implies_inactive

CREATE OR REPLACE FUNCTION public.fn_trigger_sync_product_status_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Sync is_active <-> active
  IF 'active' = ANY(COALESCE(NEW.locked_fields, '{}')) THEN
    NEW.is_active := NEW.active;
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    NEW.active := NEW.is_active;
  ELSIF NEW.active IS DISTINCT FROM OLD.active THEN
    NEW.is_active := NEW.active;
  END IF;

  -- Sync is_deleted -> deleted_at
  IF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted THEN
    IF NEW.is_deleted = true AND NEW.deleted_at IS NULL THEN
      NEW.deleted_at := NOW();
    ELSIF NEW.is_deleted = false THEN
      NEW.deleted_at := NULL;
    END IF;
  ELSIF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    IF NEW.deleted_at IS NOT NULL AND NEW.is_deleted = false THEN
      NEW.is_deleted := true;
    ELSIF NEW.deleted_at IS NULL AND NEW.is_deleted = true THEN
      NEW.is_deleted := false;
    END IF;
  END IF;

  -- FIX (catalog audit 2026-06-17): deletado NUNCA pode permanecer ativo.
  -- Fecha o gap que gerou os 5 produtos "fantasma" (is_deleted=true porém active=true).
  -- Roda DEPOIS do guarda trg_aa_block_product_deactivation (ordem alfabética de
  -- triggers), então a desativação implícita pela deleção não é bloqueada.
  IF NEW.is_deleted IS TRUE AND (NEW.active IS TRUE OR NEW.is_active IS TRUE) THEN
    NEW.active := false;
    NEW.is_active := false;
  END IF;

  RETURN NEW;
END;
$function$;
