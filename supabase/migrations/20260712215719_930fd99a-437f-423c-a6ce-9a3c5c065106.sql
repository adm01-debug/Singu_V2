
-- Modelo de relacionamentos entre entidades (Empresa/Pessoa) com papéis (comprador, gerente, proprietário)

-- 1. Enum de tipos de entidade
DO $$ BEGIN
  CREATE TYPE public.entity_type AS ENUM ('company', 'contact');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Enum de papéis do relacionamento
DO $$ BEGIN
  CREATE TYPE public.entity_relationship_role AS ENUM (
    'buyer',        -- comprador
    'manager',      -- gerente
    'owner',        -- proprietário
    'decision_maker',
    'influencer',
    'user',
    'sponsor',
    'partner',
    'supplier',
    'subsidiary',   -- filial de
    'parent',       -- matriz de
    'employee_of',  -- funcionário de
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Tabela de relacionamentos polimórficos
CREATE TABLE IF NOT EXISTS public.entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type public.entity_type NOT NULL,
  from_id   UUID NOT NULL,
  to_type   public.entity_type NOT NULL,
  to_id     UUID NOT NULL,
  role      public.entity_relationship_role NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  started_at DATE,
  ended_at   DATE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entity_relationships_no_self CHECK (NOT (from_type = to_type AND from_id = to_id)),
  CONSTRAINT entity_relationships_period_valid CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at),
  CONSTRAINT entity_relationships_unique UNIQUE (from_type, from_id, to_type, to_id, role)
);

CREATE INDEX IF NOT EXISTS idx_entity_rel_from ON public.entity_relationships (from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_to   ON public.entity_relationships (to_type, to_id);
CREATE INDEX IF NOT EXISTS idx_entity_rel_role ON public.entity_relationships (role);
CREATE INDEX IF NOT EXISTS idx_entity_rel_primary ON public.entity_relationships (from_type, from_id, role) WHERE is_primary;

-- 4. GRANTs (obrigatório para PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_relationships TO authenticated;
GRANT ALL ON public.entity_relationships TO service_role;

-- 5. RLS
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users read entity_relationships"
  ON public.entity_relationships FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth users insert entity_relationships"
  ON public.entity_relationships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "creator or admin updates entity_relationships"
  ON public.entity_relationships FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "creator or admin deletes entity_relationships"
  ON public.entity_relationships FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 6. Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_entity_relationships_updated_at ON public.entity_relationships;
CREATE TRIGGER trg_entity_relationships_updated_at
BEFORE UPDATE ON public.entity_relationships
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7. Trigger de garantia de FK polimórfica + único "primary" por (from, role)
CREATE OR REPLACE FUNCTION public.validate_entity_relationship()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ok BOOLEAN;
BEGIN
  -- valida FROM
  IF NEW.from_type = 'company' THEN
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = NEW.from_id) INTO ok;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.contacts  WHERE id = NEW.from_id) INTO ok;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'from entity % % não existe', NEW.from_type, NEW.from_id; END IF;

  -- valida TO
  IF NEW.to_type = 'company' THEN
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = NEW.to_id) INTO ok;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.contacts  WHERE id = NEW.to_id) INTO ok;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'to entity % % não existe', NEW.to_type, NEW.to_id; END IF;

  -- garante único primary por (from, role)
  IF NEW.is_primary THEN
    UPDATE public.entity_relationships
       SET is_primary = false
     WHERE from_type = NEW.from_type
       AND from_id   = NEW.from_id
       AND role      = NEW.role
       AND id <> NEW.id
       AND is_primary = true;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_entity_relationship ON public.entity_relationships;
CREATE TRIGGER trg_validate_entity_relationship
BEFORE INSERT OR UPDATE ON public.entity_relationships
FOR EACH ROW EXECUTE FUNCTION public.validate_entity_relationship();

-- 8. View unificada de entidades (Empresa/Pessoa como "Entidade")
CREATE OR REPLACE VIEW public.v_entities AS
  SELECT
    'company'::public.entity_type AS entity_type,
    c.id,
    COALESCE(c.name, c.nome_fantasia, c.razao_social) AS display_name,
    c.email, c.phone, c.created_at, c.updated_at
  FROM public.companies c
  UNION ALL
  SELECT
    'contact'::public.entity_type,
    p.id,
    TRIM(BOTH ' ' FROM CONCAT_WS(' ', p.first_name, p.last_name)) AS display_name,
    p.email, p.phone, p.created_at, p.updated_at
  FROM public.contacts p;

GRANT SELECT ON public.v_entities TO authenticated;

COMMENT ON TABLE  public.entity_relationships IS 'Relacionamentos polimórficos entre Empresa/Pessoa com papel (comprador, gerente, proprietário, ...).';
COMMENT ON VIEW   public.v_entities IS 'Visão unificada de Empresas e Pessoas como Entidades.';
