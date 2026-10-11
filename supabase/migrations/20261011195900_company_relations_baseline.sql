-- UP MIGRATION: reproduz as relações canônicas de empresas sem alterar objetos existentes.
DO $tables$
DECLARE
  new_relations text[] := '{}';
  relation_table text;
  scope text;
BEGIN
  IF to_regclass('public.estados') IS NULL THEN
    CREATE TABLE public.estados (
      ibge_code integer PRIMARY KEY,
      uf character(2) NOT NULL UNIQUE,
      nome varchar(50) NOT NULL,
      regiao_sigla character(2),
      regiao_nome varchar(20),
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.estados FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.estados TO authenticated;
    GRANT ALL ON public.estados TO service_role;
    CREATE POLICY singu_geo_read ON public.estados FOR SELECT TO authenticated USING (true);
  END IF;
  IF to_regclass('public.cidades') IS NULL THEN
    CREATE TABLE public.cidades (
      ibge_code integer PRIMARY KEY,
      nome varchar(120) NOT NULL,
      estado_ibge integer NOT NULL REFERENCES public.estados(ibge_code),
      uf character(2) NOT NULL,
      mesorregiao varchar(100),
      microrregiao varchar(100),
      regiao_imediata varchar(100),
      regiao_intermediaria varchar(100),
      latitude numeric(10,7),
      longitude numeric(10,7),
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.cidades FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.cidades TO authenticated;
    GRANT ALL ON public.cidades TO service_role;
    CREATE POLICY singu_geo_read ON public.cidades FOR SELECT TO authenticated USING (true);
  END IF;
  IF to_regclass('public.company_phones') IS NULL THEN
    CREATE TABLE public.company_phones (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      phone_type public.phone_type DEFAULT 'fixo_comercial',
      numero varchar(50) NOT NULL,
      numero_normalizado varchar(20) NOT NULL,
      ramal varchar(10),
      is_primary boolean DEFAULT false,
      is_whatsapp boolean DEFAULT false,
      departamento varchar(50),
      observacao varchar(100),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      numero_e164 varchar(20),
      fonte varchar(100),
      contexto varchar(200),
      confiabilidade smallint,
      CONSTRAINT company_phones_company_id_numero_norm_unique UNIQUE (company_id, numero_normalizado)
    );
    CREATE INDEX IF NOT EXISTS idx_company_phones_e164 ON public.company_phones(numero_e164) WHERE numero_e164 IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_company_phones_normalizado ON public.company_phones(numero_normalizado);
    CREATE INDEX IF NOT EXISTS idx_company_phones_whatsapp ON public.company_phones(company_id) WHERE is_whatsapp = true;
    CREATE INDEX IF NOT EXISTS idx_company_phones_created_at ON public.company_phones(created_at);
    new_relations := array_append(new_relations, 'company_phones');
  END IF;
  IF to_regclass('public.company_emails') IS NULL THEN
    CREATE TABLE public.company_emails (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      email_type public.email_type DEFAULT 'corporativo',
      email varchar(255) NOT NULL,
      email_normalizado varchar(255),
      is_primary boolean DEFAULT false,
      departamento varchar(50),
      observacao varchar(100),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      fonte varchar(100),
      contexto varchar(200),
      confiabilidade smallint,
      is_verified boolean DEFAULT false
    );
    CREATE INDEX IF NOT EXISTS idx_company_emails_company_id ON public.company_emails(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_emails_email_lower ON public.company_emails(lower(email::text));
    CREATE UNIQUE INDEX IF NOT EXISTS company_emails_company_id_email_ci_unique ON public.company_emails(company_id, lower(email::text));
    new_relations := array_append(new_relations, 'company_emails');
  END IF;
  IF to_regclass('public.company_addresses') IS NULL THEN
    CREATE TABLE public.company_addresses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      tipo varchar(20) DEFAULT 'comercial',
      is_primary boolean DEFAULT false,
      cep varchar(10),
      logradouro varchar(255),
      numero varchar(20),
      complemento varchar(100),
      bairro varchar(100),
      cidade varchar(100),
      estado varchar(2),
      pais varchar(50) DEFAULT 'Brasil',
      latitude numeric(10,8),
      longitude numeric(11,8),
      ponto_referencia varchar(255),
      instrucoes_entrega text,
      horario_funcionamento varchar(100),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      google_maps_url text,
      google_place_id text,
      origem varchar(50),
      cidade_ibge integer REFERENCES public.cidades(ibge_code),
      tipo_logradouro varchar(50)
    );
    CREATE INDEX IF NOT EXISTS idx_company_addresses_primary ON public.company_addresses(company_id, is_primary);
    CREATE INDEX IF NOT EXISTS idx_company_addresses_cep ON public.company_addresses(cep);
    CREATE INDEX IF NOT EXISTS idx_company_addresses_cidade ON public.company_addresses(cidade, estado);
    CREATE INDEX IF NOT EXISTS idx_company_addresses_company ON public.company_addresses(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_addresses_tipo_logradouro ON public.company_addresses(tipo_logradouro);
    CREATE INDEX IF NOT EXISTS idx_company_addresses_cidade_ibge ON public.company_addresses(cidade_ibge);
    CREATE INDEX IF NOT EXISTS idx_company_addresses_created_at ON public.company_addresses(created_at);
    new_relations := array_append(new_relations, 'company_addresses');
  END IF;
  FOREACH relation_table IN ARRAY new_relations LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', relation_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', relation_table);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', relation_table);
    scope := format('EXISTS (SELECT 1 FROM public.companies c WHERE c.id = %I.company_id AND c.user_id = (SELECT auth.uid())) OR (SELECT public.has_role(auth.uid(), ''admin''::public.app_role))', relation_table);
    EXECUTE format('CREATE POLICY singu_company_relation_owner ON public.%I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', relation_table, scope, scope);
  END LOOP;
END;
$tables$;

DO $functions$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    EXECUTE $ddl$
      CREATE FUNCTION public.set_updated_at() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $body$
      BEGIN
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $body$;
    $ddl$;
    REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;
  END IF;
  IF to_regprocedure('public.trg_normalizar_telefone()') IS NULL THEN
    EXECUTE $ddl$
      CREATE FUNCTION public.trg_normalizar_telefone() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $body$
      DECLARE nn text; eh_celular boolean;
      BEGIN
        IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN
          nn := regexp_replace(NEW.numero, '[^0-9]', '', 'g');
        ELSE
          nn := regexp_replace(COALESCE(NEW.numero_normalizado, ''), '[^0-9]', '', 'g');
        END IF;
        IF nn = '' THEN RETURN NEW; END IF;
        IF length(nn) >= 12 AND left(nn, 2) = '55' THEN nn := substring(nn FROM 3); END IF;
        IF length(nn) < 8 OR length(nn) > 13 THEN
          RAISE EXCEPTION 'Número de telefone inválido: "%" — deve ter entre 8 e 13 dígitos (recebido: % dígitos)',
            COALESCE(NEW.numero, NEW.numero_normalizado), length(nn);
        END IF;
        NEW.numero_normalizado := nn;
        NEW.numero_e164 := '+55' || nn;
        eh_celular := length(nn) = 11 AND substring(nn FROM 3 FOR 1) = '9';
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.numero IS DISTINCT FROM NEW.numero) THEN
          IF eh_celular THEN
            NEW.phone_type := 'celular_corporativo'::public.phone_type;
            NEW.is_whatsapp := true;
          ELSE
            NEW.phone_type := 'fixo_comercial'::public.phone_type;
            NEW.is_whatsapp := COALESCE(NEW.is_whatsapp, false);
          END IF;
        END IF;
        RETURN NEW;
      END;
      $body$;
    $ddl$;
    REVOKE EXECUTE ON FUNCTION public.trg_normalizar_telefone() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.trg_normalizar_telefone() TO service_role;
  END IF;
  IF to_regprocedure('public.trg_normalizar_email()') IS NULL THEN
    EXECUTE $ddl$
      CREATE FUNCTION public.trg_normalizar_email() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $body$
      DECLARE
        email_clean text; local_part text; domain_part text; p text;
        dominios_pessoais text[] := ARRAY['gmail.com','gmail.com.br','hotmail.com','hotmail.com.br','outlook.com','outlook.com.br','yahoo.com','yahoo.com.br','live.com','live.com.br','msn.com','msn.com.br','icloud.com','protonmail.com','proton.me','uol.com.br','bol.com.br','terra.com.br','ig.com.br','globo.com','globomail.com','zipmail.com.br','oi.com.br','r7.com','aol.com'];
        patterns_nfe text[] := ARRAY['nfe','nf-e','nf_e','fiscal','xml','sped','notafiscal','nota_fiscal','nota-fiscal','danfe'];
        patterns_financeiro text[] := ARRAY['financeiro','financ','contas','pagamento','cobranca','boleto','fatura','tesouraria','contabil','contabilidade'];
        patterns_compras text[] := ARRAY['compras','compra','cotacao','cotacoes','suprimentos','suprimento','almoxarifado','procurement','purchasing'];
        patterns_comercial text[] := ARRAY['comercial','vendas','venda','negocio','negocios','atendimento','sac','ouvidoria','relacionamento'];
        patterns_marketing text[] := ARRAY['marketing','mkt','comunicacao','propaganda','midia','publicidade','endomarketing','digital'];
      BEGIN
        IF NEW.email IS NULL OR trim(NEW.email) = '' THEN RETURN NEW; END IF;
        email_clean := lower(trim(NEW.email));
        NEW.email := email_clean;
        NEW.email_normalizado := email_clean;
        IF position('@' IN email_clean) = 0 THEN RETURN NEW; END IF;
        local_part := split_part(email_clean, '@', 1);
        domain_part := split_part(email_clean, '@', 2);
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email != NEW.email) THEN
          IF domain_part = ANY(dominios_pessoais) THEN NEW.email_type := 'pessoal'::public.email_type; RETURN NEW; END IF;
          FOREACH p IN ARRAY patterns_nfe LOOP
            IF local_part LIKE '%' || p || '%' THEN NEW.email_type := 'nfe'::public.email_type; RETURN NEW; END IF;
          END LOOP;
          FOREACH p IN ARRAY patterns_financeiro LOOP
            IF local_part LIKE '%' || p || '%' THEN NEW.email_type := 'financeiro'::public.email_type; RETURN NEW; END IF;
          END LOOP;
          FOREACH p IN ARRAY patterns_compras LOOP
            IF local_part LIKE '%' || p || '%' THEN NEW.email_type := 'compras'::public.email_type; RETURN NEW; END IF;
          END LOOP;
          FOREACH p IN ARRAY patterns_comercial LOOP
            IF local_part LIKE '%' || p || '%' THEN NEW.email_type := 'comercial'::public.email_type; RETURN NEW; END IF;
          END LOOP;
          FOREACH p IN ARRAY patterns_marketing LOOP
            IF local_part LIKE '%' || p || '%' THEN NEW.email_type := 'marketing'::public.email_type; RETURN NEW; END IF;
          END LOOP;
          NEW.email_type := 'corporativo'::public.email_type;
        END IF;
        RETURN NEW;
      END;
      $body$;
    $ddl$;
    REVOKE EXECUTE ON FUNCTION public.trg_normalizar_email() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.trg_normalizar_email() TO service_role;
  END IF;
  IF to_regprocedure('public.singu_sync_company_address()') IS NULL THEN
    EXECUTE $ddl$
      CREATE FUNCTION public.singu_sync_company_address() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $body$
      DECLARE
        v_company_id uuid; v_cidade text; v_estado text;
        v_logradouro text; v_numero text; v_bairro text; v_address_full text;
      BEGIN
        v_company_id := COALESCE(NEW.company_id, OLD.company_id);
        SELECT cidade, estado, logradouro, numero, bairro
          INTO v_cidade, v_estado, v_logradouro, v_numero, v_bairro
          FROM public.company_addresses WHERE company_id = v_company_id
          ORDER BY is_primary DESC NULLS LAST, created_at DESC LIMIT 1;
        v_address_full := NULLIF(trim(COALESCE(v_logradouro, '') ||
          CASE WHEN v_numero IS NOT NULL THEN ', ' || v_numero ELSE '' END ||
          CASE WHEN v_bairro IS NOT NULL THEN ' - ' || v_bairro ELSE '' END), '');
        UPDATE public.companies SET city = v_cidade, state = v_estado, address = v_address_full
          WHERE id = v_company_id AND (
            COALESCE(city, '') IS DISTINCT FROM COALESCE(v_cidade, '') OR
            COALESCE(state, '') IS DISTINCT FROM COALESCE(v_estado, '') OR
            COALESCE(address, '') IS DISTINCT FROM COALESCE(v_address_full, ''));
        RETURN COALESCE(NEW, OLD);
      END;
      $body$;
    $ddl$;
    REVOKE EXECUTE ON FUNCTION public.singu_sync_company_address() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.singu_sync_company_address() TO service_role;
  END IF;
END;
$functions$;

DO $triggers$
DECLARE t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('company_phones', 'trg_set_updated_at', 'BEFORE UPDATE', 'set_updated_at'),
    ('company_emails', 'trg_set_updated_at', 'BEFORE UPDATE', 'set_updated_at'),
    ('company_addresses', 'trg_set_updated_at', 'BEFORE UPDATE', 'set_updated_at'),
    ('company_phones', 'trg_company_phones_normalizar', 'BEFORE INSERT OR UPDATE', 'trg_normalizar_telefone'),
    ('company_emails', 'trg_company_emails_normalizar', 'BEFORE INSERT OR UPDATE OF email', 'trg_normalizar_email'),
    ('company_addresses', 'trg_singu_sync_company_address', 'AFTER INSERT OR DELETE OR UPDATE', 'singu_sync_company_address')
  ) AS triggers(relation_table, trigger_name, event_clause, function_name) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger
      WHERE tgrelid = format('public.%I', t.relation_table)::regclass AND tgname = t.trigger_name) THEN
      EXECUTE format('CREATE TRIGGER %I %s ON public.%I FOR EACH ROW EXECUTE FUNCTION public.%I()',
        t.trigger_name, t.event_clause, t.relation_table, t.function_name);
    END IF;
  END LOOP;
END;
$triggers$;

-- DOWN MIGRATION (Rollback): os objetos já existentes no canônico não são alterados.
-- Só numa reconstrução sem dados e sem consumidores dependentes, remover os objetos
-- que foram criados por esta migration; nunca apagar as relações originais de produção.
-- DROP TABLE IF EXISTS public.company_phones;
-- DROP TABLE IF EXISTS public.company_emails;
-- DROP TABLE IF EXISTS public.company_addresses;
-- DROP TABLE IF EXISTS public.cidades;
-- DROP TABLE IF EXISTS public.estados;
-- Os helpers só podem ser removidos se criados aqui e sem outros gatilhos consumidores:
-- DROP FUNCTION IF EXISTS public.trg_normalizar_telefone();
-- DROP FUNCTION IF EXISTS public.trg_normalizar_email();
-- DROP FUNCTION IF EXISTS public.singu_sync_company_address();
-- DROP FUNCTION IF EXISTS public.set_updated_at();
