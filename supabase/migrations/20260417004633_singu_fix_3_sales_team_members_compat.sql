-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417004633
-- nome:   singu_fix_3_sales_team_members_compat

-- ============================================================================
-- FIX #3 — sales_team_members.member_user_id NOT NULL (pre-existente CRM)
-- SINGU envia só user_id. Solução: trigger que seta member_user_id := user_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.singu_sales_team_members_compat()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- SINGU só envia user_id, CRM exige member_user_id
  IF NEW.member_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.member_user_id := NEW.user_id;
  END IF;
  -- Caso contrário (SINGU enviando profile_user_id), fallback
  IF NEW.member_user_id IS NULL AND NEW.profile_user_id IS NOT NULL THEN
    NEW.member_user_id := NEW.profile_user_id;
    IF NEW.user_id IS NULL THEN NEW.user_id := NEW.profile_user_id; END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_sales_team_members_compat() IS 'SINGU: preenche member_user_id (CRM NOT NULL) a partir de user_id enviado pelo SINGU.';

DROP TRIGGER IF EXISTS trg_singu_sales_team_compat ON public.sales_team_members;
CREATE TRIGGER trg_singu_sales_team_compat
BEFORE INSERT OR UPDATE OF user_id, member_user_id, profile_user_id
ON public.sales_team_members
FOR EACH ROW
EXECUTE FUNCTION public.singu_sales_team_members_compat();
