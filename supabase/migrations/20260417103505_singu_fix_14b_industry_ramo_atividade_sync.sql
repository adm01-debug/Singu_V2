-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417103505
-- nome:   singu_fix_14b_industry_ramo_atividade_sync

-- Expandir singu_companies_compat_sync para sync industry ↔ ramo_atividade  
CREATE OR REPLACE FUNCTION public.singu_companies_compat_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Sync name ↔ nome_crm
  IF NEW.nome_crm IS NULL AND NEW.name IS NOT NULL THEN
    NEW.nome_crm := NEW.name;
  ELSIF NEW.name IS NULL AND NEW.nome_crm IS NOT NULL THEN
    NEW.name := NEW.nome_crm;
  END IF;
  IF NEW.nome_crm IS NULL THEN
    NEW.nome_crm := COALESCE(NEW.nome_fantasia, NEW.razao_social, 'Empresa sem nome');
    NEW.name := NEW.nome_crm;
  END IF;

  -- Sync industry ↔ ramo_atividade (NOVO)
  IF NEW.industry IS NULL AND NEW.ramo_atividade IS NOT NULL THEN
    NEW.industry := NEW.ramo_atividade;
  ELSIF NEW.ramo_atividade IS NULL AND NEW.industry IS NOT NULL THEN
    NEW.ramo_atividade := NEW.industry;
  END IF;

  -- Normalizar financial_health
  IF NEW.financial_health IS NOT NULL THEN
    NEW.financial_health := CASE
      WHEN NEW.financial_health = ANY(ARRAY['growing','stable','cutting','unknown']) THEN NEW.financial_health
      WHEN NEW.financial_health ILIKE '%cresc%' OR NEW.financial_health ILIKE '%grow%' OR NEW.financial_health ILIKE '%bom%' THEN 'growing'
      WHEN NEW.financial_health ILIKE '%estav%' OR NEW.financial_health ILIKE '%stab%' OR NEW.financial_health ILIKE '%ok%' THEN 'stable'
      WHEN NEW.financial_health ILIKE '%cort%' OR NEW.financial_health ILIKE '%cut%' OR NEW.financial_health ILIKE '%ruim%' OR NEW.financial_health ILIKE '%crise%' THEN 'cutting'
      ELSE 'unknown'
    END;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_companies_compat_sync() IS 'SINGU: sync name↔nome_crm, industry↔ramo_atividade, normaliza financial_health.';

-- Recriar trigger com WHEN que captura TODAS essas colunas
DROP TRIGGER IF EXISTS trg_singu_companies_compat ON public.companies;
CREATE TRIGGER a_singu_normalize_companies
BEFORE INSERT OR UPDATE OF name, nome_crm, nome_fantasia, razao_social, industry, ramo_atividade, financial_health
ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.singu_companies_compat_sync();
