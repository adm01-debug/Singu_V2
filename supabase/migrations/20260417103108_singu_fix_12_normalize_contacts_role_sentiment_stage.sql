-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417103108
-- nome:   singu_fix_12_normalize_contacts_role_sentiment_stage

-- ============================================================================
-- FIX #12 — Normalizar CHECK constraints de contacts para aceitar valores pt/en
-- Constraints: role, relationship_stage, sentiment, departamento
-- ============================================================================

CREATE OR REPLACE FUNCTION public.singu_contacts_normalize_checks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- role: owner, manager, buyer, contact, decision_maker, influencer
  IF NEW.role IS NOT NULL THEN
    NEW.role := CASE
      WHEN NEW.role = ANY(ARRAY['owner','manager','buyer','contact','decision_maker','influencer']) THEN NEW.role
      -- pt-BR variations
      WHEN NEW.role ILIKE '%propriet%' OR NEW.role = 'dono' OR NEW.role ILIKE '%founder%' OR NEW.role ILIKE '%ceo%' THEN 'owner'
      WHEN NEW.role ILIKE '%gerent%' OR NEW.role ILIKE '%manager%' OR NEW.role ILIKE '%diretor%' THEN 'manager'
      WHEN NEW.role ILIKE '%compra%' OR NEW.role ILIKE '%buyer%' OR NEW.role = 'comprador' THEN 'buyer'
      WHEN NEW.role ILIKE '%decisor%' OR NEW.role ILIKE '%decision%' OR NEW.role ILIKE '%tomada%' THEN 'decision_maker'
      WHEN NEW.role ILIKE '%influe%' OR NEW.role ILIKE '%influenc%' THEN 'influencer'
      ELSE 'contact'  -- fallback
    END;
  END IF;

  -- relationship_stage: unknown, prospect, qualified_lead, opportunity, negotiation, customer, loyal_customer, advocate, at_risk, lost
  IF NEW.relationship_stage IS NOT NULL THEN
    NEW.relationship_stage := CASE
      WHEN NEW.relationship_stage = ANY(ARRAY['unknown','prospect','qualified_lead','opportunity','negotiation','customer','loyal_customer','advocate','at_risk','lost']) THEN NEW.relationship_stage
      WHEN NEW.relationship_stage ILIKE '%prospec%' THEN 'prospect'
      WHEN NEW.relationship_stage ILIKE '%qualifi%' OR NEW.relationship_stage ILIKE '%lead%' THEN 'qualified_lead'
      WHEN NEW.relationship_stage ILIKE '%oportun%' OR NEW.relationship_stage ILIKE '%opportun%' THEN 'opportunity'
      WHEN NEW.relationship_stage ILIKE '%negoc%' OR NEW.relationship_stage ILIKE '%negotia%' THEN 'negotiation'
      WHEN NEW.relationship_stage ILIKE '%cliente%fi%' OR NEW.relationship_stage ILIKE '%loyal%' THEN 'loyal_customer'
      WHEN NEW.relationship_stage ILIKE '%cliente%' OR NEW.relationship_stage ILIKE '%customer%' THEN 'customer'
      WHEN NEW.relationship_stage ILIKE '%advoca%' OR NEW.relationship_stage ILIKE '%promotor%' THEN 'advocate'
      WHEN NEW.relationship_stage ILIKE '%risco%' OR NEW.relationship_stage ILIKE '%risk%' THEN 'at_risk'
      WHEN NEW.relationship_stage ILIKE '%perdi%' OR NEW.relationship_stage ILIKE '%lost%' OR NEW.relationship_stage ILIKE '%churn%' THEN 'lost'
      ELSE 'unknown'
    END;
  END IF;

  -- sentiment: positive, neutral, negative
  IF NEW.sentiment IS NOT NULL THEN
    NEW.sentiment := CASE
      WHEN NEW.sentiment = ANY(ARRAY['positive','neutral','negative']) THEN NEW.sentiment
      WHEN NEW.sentiment ILIKE '%posit%' OR NEW.sentiment ILIKE '%bom%' OR NEW.sentiment ILIKE '%bem%' THEN 'positive'
      WHEN NEW.sentiment ILIKE '%negat%' OR NEW.sentiment ILIKE '%ruim%' OR NEW.sentiment ILIKE '%mal%' THEN 'negative'
      ELSE 'neutral'
    END;
  END IF;

  -- departamento: Compras, Marketing, RH, Diretoria, Financeiro, Comercial, Gestão
  IF NEW.departamento IS NOT NULL THEN
    NEW.departamento := CASE
      WHEN NEW.departamento = ANY(ARRAY['Compras','Marketing','RH','Diretoria','Financeiro','Comercial','Gestão']) THEN NEW.departamento
      WHEN NEW.departamento ILIKE '%compra%' OR NEW.departamento ILIKE '%purchas%' OR NEW.departamento ILIKE '%procure%' THEN 'Compras'
      WHEN NEW.departamento ILIKE '%market%' THEN 'Marketing'
      WHEN NEW.departamento ILIKE '%rh%' OR NEW.departamento ILIKE '%hr%' OR NEW.departamento ILIKE '%human%' OR NEW.departamento ILIKE '%people%' THEN 'RH'
      WHEN NEW.departamento ILIKE '%direto%' OR NEW.departamento ILIKE '%direc%' OR NEW.departamento ILIKE '%exec%' THEN 'Diretoria'
      WHEN NEW.departamento ILIKE '%finan%' THEN 'Financeiro'
      WHEN NEW.departamento ILIKE '%comerc%' OR NEW.departamento ILIKE '%sales%' OR NEW.departamento ILIKE '%venda%' THEN 'Comercial'
      WHEN NEW.departamento ILIKE '%gest%' OR NEW.departamento ILIKE '%manag%' THEN 'Gestão'
      ELSE NULL  -- NULL é permitido; melhor que forçar valor errado
    END;
  END IF;

  -- relationship_score: range 0-100
  IF NEW.relationship_score IS NOT NULL THEN
    NEW.relationship_score := GREATEST(0, LEAST(100, NEW.relationship_score));
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_contacts_normalize_checks() IS 'SINGU: normaliza role, relationship_stage, sentiment, departamento, relationship_score para valores válidos dos CHECK constraints. Aceita variações pt/en.';

-- Prefixo 'a_' para rodar antes de tudo
DROP TRIGGER IF EXISTS trg_singu_reverse_sync_contact ON public.contacts;
CREATE TRIGGER a_singu_normalize_contacts
BEFORE INSERT OR UPDATE OF role, relationship_stage, sentiment, departamento, relationship_score
ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.singu_contacts_normalize_checks();

-- Recriar reverse_sync depois (AFTER permanece)
CREATE TRIGGER trg_singu_reverse_sync_contact
AFTER INSERT OR UPDATE OF email, phone, whatsapp
ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.singu_reverse_sync_contact();
