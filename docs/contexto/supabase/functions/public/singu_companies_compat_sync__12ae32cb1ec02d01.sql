CREATE OR REPLACE FUNCTION public.singu_companies_compat_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Garante nome_crm sempre preenchido
  IF NEW.nome_crm IS NULL THEN
    NEW.nome_crm := COALESCE(NEW.nome_fantasia, NEW.razao_social, 'Empresa sem nome');
  END IF;

  -- Sync industry ↔ ramo_atividade
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
$function$
