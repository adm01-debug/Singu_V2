-- UP MIGRATION: reconstrói o legado comercial e restringe sua leitura ao vendedor autenticado.
DO $$
BEGIN
  IF to_regtype('public.salesperson_role') IS NULL THEN
    CREATE TYPE public.salesperson_role AS ENUM ('sdr', 'closer', 'hybrid');
  END IF;
  IF to_regtype('public.activity_type') IS NULL THEN
    CREATE TYPE public.activity_type AS ENUM ('call', 'email', 'meeting', 'linkedin', 'whatsapp', 'other');
  END IF;
  IF to_regtype('public.activity_outcome') IS NULL THEN
    CREATE TYPE public.activity_outcome AS ENUM ('connected', 'no_answer', 'scheduled', 'voicemail', 'busy', 'callback', 'not_interested', 'qualified');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.salespeople (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  avatar_url text,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  is_active boolean NOT NULL DEFAULT true,
  role public.salesperson_role NOT NULL DEFAULT 'hybrid',
  auth_user_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salespeople ADD COLUMN IF NOT EXISTS auth_user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS salespeople_auth_user_id_key ON public.salespeople(auth_user_id);

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  product_name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('completed', 'pending', 'cancelled', 'negotiation', 'proposal', 'qualification', 'discovery', 'lead')),
  category text NOT NULL DEFAULT 'subscription'
    CHECK (category IN ('subscription', 'service', 'project', 'other')),
  salesperson_id uuid REFERENCES public.salespeople(id),
  source text DEFAULT 'other',
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  salesperson_id uuid REFERENCES public.salespeople(id) ON DELETE SET NULL,
  activity_type public.activity_type NOT NULL,
  outcome public.activity_outcome NOT NULL,
  notes text,
  duration_minutes integer,
  contact_name text,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  delete_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  relation_name text;
  policy_name text;
  columns_list text;
  inherited_role text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY['salespeople', 'sales', 'sales_activities'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_name);
    FOR policy_name IN
      SELECT polname FROM pg_policy WHERE polrelid = format('public.%I', relation_name)::regclass
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, relation_name);
    END LOOP;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', relation_name);
    SELECT string_agg(format('%I', attname), ', ') INTO columns_list
    FROM pg_attribute
    WHERE attrelid = format('public.%I', relation_name)::regclass AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM PUBLIC', columns_list, relation_name);
    FOR inherited_role IN
      SELECT rolname FROM pg_roles
      WHERE pg_has_role('authenticated', oid, 'USAGE') OR pg_has_role('anon', oid, 'USAGE')
    LOOP
      IF inherited_role = 'service_role' THEN
        RAISE EXCEPTION 'Usuários comuns herdam os privilégios do serviço';
      END IF;
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', relation_name, inherited_role);
      EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM %I', columns_list, relation_name, inherited_role);
    END LOOP;
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', relation_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', relation_name);
    EXECUTE format('CREATE POLICY legacy_sales_service ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', relation_name);
  END LOOP;
END $$;

CREATE POLICY legacy_salespeople_owner ON public.salespeople
  FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY legacy_sales_owner ON public.sales
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.salespeople sp
    WHERE sp.id = sales.salesperson_id AND sp.auth_user_id = (SELECT auth.uid())
  ));

CREATE POLICY legacy_sales_activities_owner ON public.sales_activities
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.salespeople sp
    WHERE sp.id = sales_activities.salesperson_id AND sp.auth_user_id = (SELECT auth.uid())
  ) AND (sale_id IS NULL OR EXISTS (
    SELECT 1 FROM public.sales s WHERE s.id = sales_activities.sale_id
  )));

DO $$
DECLARE
  relation_name regclass;
  columns_list text;
  inherited_role text;
BEGIN
  FOR relation_name IN
    WITH RECURSIVE dependent(oid) AS (
      SELECT unnest(ARRAY['public.sales'::regclass::oid, 'public.salespeople'::regclass::oid, 'public.sales_activities'::regclass::oid])
      UNION
      SELECT rw.ev_class FROM dependent dep
      JOIN pg_depend d ON d.refobjid = dep.oid AND d.classid = 'pg_rewrite'::regclass
      JOIN pg_rewrite rw ON rw.oid = d.objid
      JOIN pg_class c ON c.oid = rw.ev_class
      WHERE c.relkind IN ('v', 'm')
    )
    SELECT dep.oid::regclass FROM dependent dep JOIN pg_class c ON c.oid = dep.oid WHERE c.relkind IN ('v', 'm')
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC', relation_name);
    SELECT string_agg(format('%I', attname), ', ') INTO columns_list
    FROM pg_attribute WHERE attrelid = relation_name AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL (%s) ON TABLE %s FROM PUBLIC', columns_list, relation_name);
    FOR inherited_role IN
      SELECT rolname FROM pg_roles
      WHERE pg_has_role('authenticated', oid, 'USAGE') OR pg_has_role('anon', oid, 'USAGE')
    LOOP
      IF inherited_role = 'service_role' THEN
        RAISE EXCEPTION 'Usuários comuns herdam os privilégios do serviço';
      END IF;
      EXECUTE format('REVOKE ALL ON TABLE %s FROM %I', relation_name, inherited_role);
      EXECUTE format('REVOKE ALL (%s) ON TABLE %s FROM %I', columns_list, relation_name, inherited_role);
    END LOOP;
    IF has_any_column_privilege('authenticated', relation_name, 'SELECT')
      OR has_any_column_privilege('anon', relation_name, 'SELECT') THEN
      RAISE EXCEPTION 'Visão comercial continua acessível: %', relation_name;
    END IF;
    EXECUTE format('GRANT SELECT ON TABLE %s TO service_role', relation_name);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS legacy_sales_salesperson_scope_idx ON public.sales(salesperson_id);
CREATE INDEX IF NOT EXISTS legacy_sales_activities_salesperson_scope_idx ON public.sales_activities(salesperson_id);
CREATE INDEX IF NOT EXISTS legacy_sales_activities_sale_scope_idx ON public.sales_activities(sale_id);

-- DOWN MIGRATION (Rollback): primeiro suspenda o proxy e os consumidores do legado.
-- Preserve tabelas, enums, registros, RLS e os grants restritos: restaurar leitura global exporia outros usuários.
-- Restaure políticas/grants específicos somente após validar novamente o isolamento e os consumidores.
-- DROP INDEX IF EXISTS public.legacy_sales_salesperson_scope_idx;
-- DROP INDEX IF EXISTS public.legacy_sales_activities_salesperson_scope_idx;
-- DROP INDEX IF EXISTS public.legacy_sales_activities_sale_scope_idx;
