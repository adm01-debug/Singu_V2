-- ============================================================
-- COMPAT: colunas preexistentes em producao (pre-jan/2026)
-- Espelha o schema real de producao para o replay local e o
-- Supabase Preview reconstruirem a mesma cadeia DDL.
-- Colunas adicionadas com IF NOT EXISTS - seguras para re-aplicar.
-- ============================================================

-- Enum company_status (criado em producao antes de 2026; no repo
-- so aparece em out/2026 via 20261008120000, mas views de marco/2026
-- ja o usam -> precisa existir no baseline).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status') THEN
    CREATE TYPE public.company_status AS ENUM ('ativo','inativo','suspenso');
  END IF;
END $$;

-- ============ COMPANIES ============
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS bitrix_company_id integer,
  ADD COLUMN IF NOT EXISTS is_customer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_supplier boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_carrier boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nome_crm text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS cnpj_base varchar,
  ADD COLUMN IF NOT EXISTS inscricao_estadual text,
  ADD COLUMN IF NOT EXISTS inscricao_municipal text,
  ADD COLUMN IF NOT EXISTS ramo_atividade text,
  ADD COLUMN IF NOT EXISTS grupo_economico text,
  ADD COLUMN IF NOT EXISTS status company_status DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS merge_notes jsonb,
  ADD COLUMN IF NOT EXISTS bitrix_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS bitrix_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by_id integer,
  ADD COLUMN IF NOT EXISTS grupo_economico_id uuid,
  ADD COLUMN IF NOT EXISTS is_matriz boolean,
  ADD COLUMN IF NOT EXISTS matriz_id uuid,
  ADD COLUMN IF NOT EXISTS tipo_cooperativa text,
  ADD COLUMN IF NOT EXISTS central_id uuid,
  ADD COLUMN IF NOT EXISTS singular_id uuid,
  ADD COLUMN IF NOT EXISTS financial_health text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS employee_count text,
  ADD COLUMN IF NOT EXISTS annual_revenue text,
  ADD COLUMN IF NOT EXISTS competitors text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS challenges text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_array text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS cores_marca text[],
  ADD COLUMN IF NOT EXISTS confederacao_id uuid,
  ADD COLUMN IF NOT EXISTS nicho_cliente text,
  ADD COLUMN IF NOT EXISTS data_fundacao date,
  ADD COLUMN IF NOT EXISTS capital_social numeric,
  ADD COLUMN IF NOT EXISTS natureza_juridica varchar,
  ADD COLUMN IF NOT EXISTS natureza_juridica_desc varchar,
  ADD COLUMN IF NOT EXISTS porte_rf varchar,
  ADD COLUMN IF NOT EXISTS situacao_rf varchar,
  ADD COLUMN IF NOT EXISTS situacao_rf_data date,
  ADD COLUMN IF NOT EXISTS extra_data_rf jsonb,
  ADD COLUMN IF NOT EXISTS numero_cooperativa varchar,
  ADD COLUMN IF NOT EXISTS lead_score integer,
  ADD COLUMN IF NOT EXISTS lead_score_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_status text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS logo_color_url text,
  ADD COLUMN IF NOT EXISTS logo_mono_url text,
  ADD COLUMN IF NOT EXISTS vak_dominant text,
  ADD COLUMN IF NOT EXISTS motivation_direction text,
  ADD COLUMN IF NOT EXISTS working_style text,
  ADD COLUMN IF NOT EXISTS reference_frame text,
  ADD COLUMN IF NOT EXISTS chunk_size text,
  ADD COLUMN IF NOT EXISTS action_filter text,
  ADD COLUMN IF NOT EXISTS comparison_style text,
  ADD COLUMN IF NOT EXISTS most_frequent_objection text,
  ADD COLUMN IF NOT EXISTS vak_profile jsonb,
  ADD COLUMN IF NOT EXISTS metaprogram_profile jsonb,
  ADD COLUMN IF NOT EXISTS emotional_state text,
  ADD COLUMN IF NOT EXISTS emotional_confidence numeric,
  ADD COLUMN IF NOT EXISTS emotional_trigger text,
  ADD COLUMN IF NOT EXISTS cnpj_normalizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS brand_colors jsonb,
  ADD COLUMN IF NOT EXISTS social_media_searched_at timestamptz,
  ADD COLUMN IF NOT EXISTS verificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS numero_cooperativa_singular varchar,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nome_crm_atualizado_em timestamptz,
  ADD COLUMN IF NOT EXISTS empresa_atualizada_em timestamptz,
  ADD COLUMN IF NOT EXISTS regime_tributario text;

-- ============ CONTACTS ============
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS bitrix_contact_id integer,
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS sexo text,
  ADD COLUMN IF NOT EXISTS assigned_by_id integer,
  ADD COLUMN IF NOT EXISTS source data_source,
  ADD COLUMN IF NOT EXISTS extra_data jsonb,
  ADD COLUMN IF NOT EXISTS bitrix_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS hobbies text[],
  ADD COLUMN IF NOT EXISTS interests_array text[],
  ADD COLUMN IF NOT EXISTS family_info text,
  ADD COLUMN IF NOT EXISTS personal_notes text,
  ADD COLUMN IF NOT EXISTS relationship_stage text,
  ADD COLUMN IF NOT EXISTS relationship_score integer,
  ADD COLUMN IF NOT EXISTS sentiment text,
  ADD COLUMN IF NOT EXISTS behavior jsonb,
  ADD COLUMN IF NOT EXISTS life_events jsonb,
  ADD COLUMN IF NOT EXISTS tags_array text[],
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS nome_tratamento varchar,
  ADD COLUMN IF NOT EXISTS apelido varchar,
  ADD COLUMN IF NOT EXISTS assinatura_contato varchar,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[],
  ADD COLUMN IF NOT EXISTS vak_dominant text,
  ADD COLUMN IF NOT EXISTS motivation_direction text,
  ADD COLUMN IF NOT EXISTS working_style text,
  ADD COLUMN IF NOT EXISTS reference_frame text,
  ADD COLUMN IF NOT EXISTS chunk_size text,
  ADD COLUMN IF NOT EXISTS action_filter text,
  ADD COLUMN IF NOT EXISTS comparison_style text,
  ADD COLUMN IF NOT EXISTS most_frequent_objection text,
  ADD COLUMN IF NOT EXISTS vak_profile jsonb,
  ADD COLUMN IF NOT EXISTS metaprogram_profile jsonb,
  ADD COLUMN IF NOT EXISTS emotional_state text,
  ADD COLUMN IF NOT EXISTS emotional_confidence numeric,
  ADD COLUMN IF NOT EXISTS emotional_trigger text,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz,
  ADD COLUMN IF NOT EXISTS objection_patterns jsonb,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 0;

-- ============ PROFILES ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS settings jsonb,
  ADD COLUMN IF NOT EXISTS ai_preferences jsonb,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS monthly_interactions integer,
  ADD COLUMN IF NOT EXISTS monthly_analysis integer,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean,
  ADD COLUMN IF NOT EXISTS onboarding_step integer,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS nlp_profile jsonb,
  ADD COLUMN IF NOT EXISTS preferences jsonb,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS bitrix_user_id integer;

-- ============ INTERACTIONS ============
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS assunto varchar,
  ADD COLUMN IF NOT EXISTS resumo text,
  ADD COLUMN IF NOT EXISTS conteudo text,
  ADD COLUMN IF NOT EXISTS data_interacao timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data_agendada timestamptz,
  ADD COLUMN IF NOT EXISTS duracao_segundos integer,
  ADD COLUMN IF NOT EXISTS usuario_responsavel_id integer,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS anexos jsonb,
  ADD COLUMN IF NOT EXISTS external_id varchar,
  ADD COLUMN IF NOT EXISTS source_system varchar,
  ADD COLUMN IF NOT EXISTS bitrix_activity_id integer,
  ADD COLUMN IF NOT EXISTS sentiment varchar,
  ADD COLUMN IF NOT EXISTS prioridade varchar,
  ADD COLUMN IF NOT EXISTS requer_followup boolean,
  ADD COLUMN IF NOT EXISTS data_followup timestamptz,
  ADD COLUMN IF NOT EXISTS followup_concluido boolean,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS transcription text,
  ADD COLUMN IF NOT EXISTS tags_array text[],
  ADD COLUMN IF NOT EXISTS duration integer,
  ADD COLUMN IF NOT EXISTS attachments text[],
  ADD COLUMN IF NOT EXISTS initiated_by text,
  ADD COLUMN IF NOT EXISTS response_time integer,
  ADD COLUMN IF NOT EXISTS key_insights text[],
  ADD COLUMN IF NOT EXISTS follow_up_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS follow_up_date date,
  ADD COLUMN IF NOT EXISTS emotion_analysis jsonb,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS outcome text;

-- ============ ACTIVITIES ============
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS entity_name text,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS reason text;

-- ============ INSIGHTS ============
ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS dismissed boolean,
  ADD COLUMN IF NOT EXISTS description text;

-- ============ ALERTS ============
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS interaction_id uuid,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS dismissed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS action_data jsonb,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS actioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============ PUSH_SUBSCRIPTIONS ============
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============ CONSTRAINTS PREEXISTENTES ============
-- companies.tipo_cooperativa_check: producao tinha a constraint com
-- CENTRAL/SINGULAR/PAC/CONFEDERACAO antes da mig 13154817 adicionar
-- ENTIDADE_SISTEMA (que faz DROP CONSTRAINT + ADD). Sem ela o DROP falha.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_tipo_cooperativa_check'
                 AND conrelid = 'public.companies'::regclass) THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_tipo_cooperativa_check
      CHECK (tipo_cooperativa = ANY (ARRAY['CENTRAL','SINGULAR','PAC','CONFEDERACAO']));
  END IF;
END $$;

-- ============ CONSTRAINTS ORFAOS (DROP CONSTRAINT sem IF EXISTS no repo) ============
-- Migrations recuperadas de producao fazem DROP CONSTRAINT de constraints que
-- existiam pre-jan/2026. Sem elas no replay/Preview o DROP falha (constraint
-- nao existe). Cada DO block cria a constraint so se ainda nao existir.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_departamento' AND conrelid='public.contacts'::regclass) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT chk_departamento
      CHECK (departamento IS NULL OR departamento = ANY (ARRAY['Compras','Marketing','RH','Diretoria','Financeiro','Comercial','Gest?o']));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activities_type_check' AND conrelid='public.activities'::regclass) THEN
    ALTER TABLE public.activities ADD CONSTRAINT activities_type_check
      CHECK (type = ANY (ARRAY['contact_created','contact_updated','contact_deleted','contact_viewed','contact_merged','company_created','company_updated','company_deleted','company_viewed','interaction_created','interaction_updated','interaction_deleted','call_made','message_sent','email_sent','meeting_scheduled','note_added','disc_analyzed','sentiment_analyzed','emotion_analyzed','alert_created','alert_actioned','alert_dismissed','login','logout','settings_changed','export_data','import_data']));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alerts_type_check' AND conrelid='public.alerts'::regclass) THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_type_check
      CHECK (type = ANY (ARRAY['relationship_risk','follow_up_due','birthday_reminder','inactivity_warning','sentiment_drop','opportunity','disc_insight','life_event','engagement_spike','churn_risk','upsell_opportunity','referral_opportunity','system','custom','supplier_score_baixo','supplier_destaque','supplier_homologacao_vencendo','supplier_homologacao_vencida','supplier_nao_homologado','carrier_score_baixo','carrier_destaque','carrier_homologacao_vencendo','carrier_homologacao_vencida','carrier_nao_homologado']));
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.incoming_webhooks') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incoming_webhooks_active_signature_check' AND conrelid='public.incoming_webhooks'::regclass) THEN
      ALTER TABLE public.incoming_webhooks ADD CONSTRAINT incoming_webhooks_active_signature_check
      CHECK ((NOT is_active) OR (require_signature AND (webhook_secret IS NOT NULL) AND (length(webhook_secret) >= 32)));
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='suppliers_company_id_fkey' AND conrelid='public.suppliers'::regclass) THEN
    ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='carriers_company_id_fkey' AND conrelid='public.carriers'::regclass) THEN
    ALTER TABLE public.carriers ADD CONSTRAINT carriers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customers_company_id_fkey' AND conrelid='public.customers'::regclass) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.sales') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_status_check' AND conrelid='public.sales'::regclass) THEN
      ALTER TABLE public.sales ADD CONSTRAINT sales_status_check
      CHECK (status = ANY (ARRAY['completed','pending','cancelled','negotiation','proposal','qualification','discovery','lead']));
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.sequence_enrollments') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sequence_enrollments_sequence_id_fkey' AND conrelid='public.sequence_enrollments'::regclass) THEN
      ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.sequences(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Tabela staging temporaria de producao (_stg_pac_nums), dropada em producao
-- mas usada por 20260320173453_stg_pac_ins_0 e 20260320174327_stg_pac_ins_1.
CREATE TABLE IF NOT EXISTS _stg_pac_nums (
  id UUID PRIMARY KEY,
  numero TEXT
);


-- Indice GIN de full-text search criado fora da cadeia de migrations (pre-existente
-- em producao): idx_companies_search sobre search_vector, usado por 20260321192746
-- (COMMENT ON INDEX) e dropado/semanticamente mantido depois.
CREATE INDEX IF NOT EXISTS idx_companies_search ON public.companies USING gin (search_vector);


-- ============================================================
-- STUBS de functions pre-existentes em producao (criadas fora da
-- cadeia de migrations recuperadas) ? necessarias para que o replay
-- das migrations de doc/comentario e triggers N?O quebre.
-- Assinaturas reais extra?das de producao (pg_proc).
-- Corpo neutro; implementacao real destas rotinas vive em
-- migrations posteriores ou fora do repo.
-- ============================================================
DROP FUNCTION IF EXISTS public.ativar_cliente(uuid, integer, text);
CREATE OR REPLACE FUNCTION public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$;

DROP FUNCTION IF EXISTS public.inativar_cliente(uuid, text, integer, text);
CREATE OR REPLACE FUNCTION public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer, p_executado_por_nome text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$;

DROP FUNCTION IF EXISTS public.transferir_cliente(uuid, integer, text, integer, text);
CREATE OR REPLACE FUNCTION public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$;

DROP FUNCTION IF EXISTS public.registrar_compra(uuid, numeric, text, text);
CREATE OR REPLACE FUNCTION public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$;

DROP FUNCTION IF EXISTS public.sdr_qualificar_cliente(uuid, integer, integer, text, text);
CREATE OR REPLACE FUNCTION public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$;

CREATE OR REPLACE FUNCTION public.auto_preencher_nomes_contato()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.auto_atualizar_nomes_contato()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_company_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_contact_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS json LANGUAGE plpgsql AS $$ BEGIN RETURN '{}'::json; END; $$;

CREATE OR REPLACE FUNCTION public.get_health_check()
RETURNS json LANGUAGE plpgsql AS $$ BEGIN RETURN '{"status":"ok"}'::json; END; $$;

DROP FUNCTION IF EXISTS public.search_companies(text, integer);
CREATE OR REPLACE FUNCTION public.search_companies(search_term text, max_results integer)
RETURNS TABLE(id uuid, nome_fantasia text, razao_social text, cnpj text, status text, is_customer boolean)
LANGUAGE plpgsql AS $$ BEGIN
  RETURN QUERY SELECT NULL::uuid AS id, NULL::text AS nome_fantasia, NULL::text AS razao_social, NULL::text AS cnpj, NULL::text AS status, NULL::boolean AS is_customer LIMIT 0;
END; $$;

DROP FUNCTION IF EXISTS public.search_contacts(text, integer);
CREATE OR REPLACE FUNCTION public.search_contacts(search_term text, max_results integer)
RETURNS TABLE(id uuid, full_name text, first_name text, last_name text, company_id uuid)
LANGUAGE plpgsql AS $$ BEGIN
  RETURN QUERY SELECT NULL::uuid AS id, NULL::text AS full_name, NULL::text AS first_name, NULL::text AS last_name, NULL::uuid AS company_id LIMIT 0;
END; $$;

-- Roles Supabase padrao (nao existem no container Docker de preview;
-- em producao sao criadas pelo processo de setup do Supabase).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOLOGIN;
  END IF;
END
$$;

-- Tabela pre-existente em producao (criada fora das migrations recuperadas).
CREATE SEQUENCE IF NOT EXISTS public.config_regras_negocio_id_seq;
CREATE TABLE IF NOT EXISTS public.config_regras_negocio (
  id integer NOT NULL DEFAULT nextval('config_regras_negocio_id_seq'::regclass) PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  valor text NOT NULL,
  descricao text,
  updated_at timestamp with time zone DEFAULT now()
);
ALTER SEQUENCE public.config_regras_negocio_id_seq OWNED BY public.config_regras_negocio.id;

-- Tabela pre-existente em producao (criada fora das migrations recuperadas).
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  rule_name character varying NOT NULL,
  rule_code character varying UNIQUE,
  description text,
  applies_to character varying,
  user_ids uuid[],
  role_ids uuid[],
  trigger_entity character varying,
  trigger_condition jsonb NOT NULL,
  action_type character varying,
  action_config jsonb,
  check_frequency character varying DEFAULT 'daily'::character varying,
  last_checked_at timestamp with time zone,
  cooldown_hours integer DEFAULT 24,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- Storage ? gerenciado pela plataforma no Preview e em produ??o (schema
-- storage j? existe com objetos do service). O bloco abaixo s? roda quando
-- storage.buckets N?O existe (replay local em Docker, caso do agente que
-- recuperou a migration), preservando o trabalho sem colidir com o Storage.
DO $storage_block$ BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    EXECUTE $stor$ CREATE SCHEMA IF NOT EXISTS storage $stor$;
    EXECUTE $stor$ DO $$ BEGIN
      CREATE TYPE storage.buckettype AS ENUM ('STANDARD', 'PUBLIC', 'PRIVATE');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$ $stor$;
    EXECUTE $stor$ CREATE TABLE IF NOT EXISTS storage.buckets (
      id text NOT NULL PRIMARY KEY,
      name text NOT NULL,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      public boolean DEFAULT false,
      avif_autodetection boolean DEFAULT false,
      file_size_limit bigint,
      allowed_mime_types text[],
      owner_id text,
      type storage.buckettype DEFAULT 'STANDARD',
      versioning_status text DEFAULT 'DISABLED',
      lifecycle_configuration jsonb,
      lifecycle_configuration_generation uuid
    ) $stor$;
    EXECUTE $stor$ CREATE TABLE IF NOT EXISTS storage.objects (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      bucket_id text,
      name text,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      last_accessed_at timestamptz DEFAULT now(),
      metadata jsonb,
      path_tokens text[],
      version text,
      owner_id text,
      user_metadata jsonb,
      archived_at timestamptz,
      is_delete_marker boolean DEFAULT false,
      is_versioned boolean DEFAULT false
    ) $stor$;
    EXECUTE $stor$ ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY $stor$;
    EXECUTE $stor$ ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY $stor$;
    EXECUTE $stor$ GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role $stor$;
    EXECUTE $stor$ CREATE OR REPLACE FUNCTION storage.foldername(name text)
      RETURNS text[]
      LANGUAGE plpgsql
      AS $fn$
      DECLARE
        parts text[];
      BEGIN
        SELECT string_to_array(name, '/') INTO parts;
        RETURN parts;
      END
      $fn$ $stor$;
  END IF;
END $storage_block$;

-- PIPELINES / PIPELINE_STAGES (criadas organicamente em producao
-- pelo dashboard; a migration 20260512184042 que as descreve nunca
-- rodou em producao. Schema a seguir replica o real de producao).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  tipo VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  permite_multiplos_deals BOOLEAN NOT NULL DEFAULT true,
  valor_meta_mensal NUMERIC,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  cor VARCHAR,
  ordem INTEGER NOT NULL DEFAULT 0,
  probabilidade INTEGER NOT NULL DEFAULT 0,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  sla_horas INTEGER,
  campos_obrigatorios JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "read_only_auth" ON public.pipelines FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_full" ON public.pipelines FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "read_only_auth" ON public.pipeline_stages FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "service_full" ON public.pipeline_stages FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- activities: colunas adicionadas organicamente em producao apos a criacao
-- da tabela (20260109144944). Espelhar para o replay e a 485
-- (harden_pks_policies_fk_indexes) criar idx_activities_interaction_id.
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id),
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS interaction_id UUID,
  ADD COLUMN IF NOT EXISTS data JSONB,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS reason TEXT;
