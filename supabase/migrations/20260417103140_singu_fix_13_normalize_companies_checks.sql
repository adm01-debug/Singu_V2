-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417103140
-- nome:   singu_fix_13_normalize_companies_checks

-- ============================================================================
-- FIX #13 — Normalizar CHECK constraints em companies
-- financial_health: growing, stable, cutting, unknown
-- ============================================================================

-- Ampliar o singu_companies_compat_sync para fazer isso também
CREATE OR REPLACE FUNCTION public.singu_companies_compat_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Sync name ↔ nome_crm (já existente)
  IF NEW.nome_crm IS NULL AND NEW.name IS NOT NULL THEN
    NEW.nome_crm := NEW.name;
  ELSIF NEW.name IS NULL AND NEW.nome_crm IS NOT NULL THEN
    NEW.name := NEW.nome_crm;
  END IF;
  IF NEW.nome_crm IS NULL THEN
    NEW.nome_crm := COALESCE(NEW.nome_fantasia, NEW.razao_social, 'Empresa sem nome');
    NEW.name := NEW.nome_crm;
  END IF;

  -- Normalizar financial_health: growing, stable, cutting, unknown
  IF NEW.financial_health IS NOT NULL THEN
    NEW.financial_health := CASE
      WHEN NEW.financial_health = ANY(ARRAY['growing','stable','cutting','unknown']) THEN NEW.financial_health
      WHEN NEW.financial_health ILIKE '%cresc%' OR NEW.financial_health ILIKE '%grow%' OR NEW.financial_health ILIKE '%bom%' THEN 'growing'
      WHEN NEW.financial_health ILIKE '%estav%' OR NEW.financial_health ILIKE '%stab%' OR NEW.financial_health ILIKE '%ok%' THEN 'stable'
      WHEN NEW.financial_health ILIKE '%cort%' OR NEW.financial_health ILIKE '%cut%' OR NEW.financial_health ILIKE '%ruim%' OR NEW.financial_health ILIKE '%crise%' THEN 'cutting'
      ELSE 'unknown'
    END;
  END IF;

  -- tipo_cooperativa: CENTRAL, SINGULAR, PAC, CONFEDERACAO, ENTIDADE_SISTEMA
  -- SINGU não envia este campo, deixar como está (NULL é permitido)

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_companies_compat_sync() IS 'SINGU: sync name↔nome_crm + normaliza financial_health para CHECK válido.';
