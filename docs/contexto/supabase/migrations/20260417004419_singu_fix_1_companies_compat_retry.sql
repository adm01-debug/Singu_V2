CREATE OR REPLACE FUNCTION public.singu_companies_compat_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.nome_crm IS NULL AND NEW.name IS NOT NULL THEN
    NEW.nome_crm := NEW.name;
  ELSIF NEW.name IS NULL AND NEW.nome_crm IS NOT NULL THEN
    NEW.name := NEW.nome_crm;
  END IF;
  IF NEW.nome_crm IS NULL THEN
    NEW.nome_crm := COALESCE(NEW.nome_fantasia, NEW.razao_social, 'Empresa sem nome');
    NEW.name := NEW.nome_crm;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_companies_compat_sync() IS 'SINGU: sync companies.name ↔ companies.nome_crm. Previne NOT NULL violation.';

DROP TRIGGER IF EXISTS trg_singu_companies_compat ON public.companies;
CREATE TRIGGER trg_singu_companies_compat
BEFORE INSERT OR UPDATE OF name, nome_crm, nome_fantasia, razao_social
ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.singu_companies_compat_sync();

-- Criar index trigram para search_companies_unaccent
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
ON public.companies USING gin (name public.gin_trgm_ops) 
WHERE name IS NOT NULL;
