-- ============================================================
-- REAPLICA BASELINE + COMPAT DE FORMA IDEMPOTENTE
-- ============================================================
-- Destrava o Supabase Preview da PR #267.
--
-- A preview PERSISTE mas so aplica migrations novas. As migrations
-- 20260109144945 (fundadoras), 20260110000000 (baseline) e
-- 20260110000001 (compat) ficaram REGISTRADAS no schema_migrations
-- sem aplicar seus objetos (ou aplicadas parcialmente fora de ordem).
--
-- Esta migration RECRIA, de forma 100% idempotente, todo o conteudo
-- das tres. Pode ser re-executada sem erro.
-- ============================================================
BEGIN

-- ============ FUNDADORAS (7 tabelas + 25 policies) ============
-- BASELINE das 7 tabelas FUNDADORAS (profiles, companies, contacts, interactions,
-- insights, alerts, activities) e seus policies/triggers/indices.
--
-- CAUSA RAIZ do Preview #267: o Supabase Preview aplica APENAS as migrations novas
-- (delta 20260109..20261118) sobre banco vazio; a migration 1cfd4579 (criadora
-- destas tabelas) ja esta na main e e IGNORADA pelo Preview. Sem as fundadoras,
-- 20260326115101 (CREATE INDEX em contacts) falhava com 42P01.
--
-- Este arquivo RECRIA as fundadoras de forma idempotente (IF NOT EXISTS + DROP IF EXISTS):
-- - no Preview/delta (banco vazio): cria as tabelas e dependencias;
-- - no replay completo (1cfd4579 ja rodou): vira no-op.

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role_title TEXT,
  company_name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "language": "pt-BR"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles

-- policy Users can view their own profile (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles

-- policy Users can update their own profile (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles

-- policy Users can insert their own profile (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
  END IF;
END $pol$

-- 2. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  financial_health TEXT CHECK (financial_health IN ('growing', 'stable', 'cutting', 'unknown')) DEFAULT 'unknown',
  employee_count TEXT,
  annual_revenue TEXT,
  competitors TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies

-- policy Users can view their own companies (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Users can view their own companies') THEN
    CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies

-- policy Users can insert their own companies (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Users can insert their own companies') THEN
    CREATE POLICY "Users can insert their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies

-- policy Users can update their own companies (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Users can update their own companies') THEN
    CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies

-- policy Users can delete their own companies (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Users can delete their own companies') THEN
    CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

-- 3. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'manager', 'buyer', 'contact', 'decision_maker', 'influencer')) DEFAULT 'contact',
  role_title TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  linkedin TEXT,
  instagram TEXT,
  twitter TEXT,
  avatar_url TEXT,
  birthday DATE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  hobbies TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  family_info TEXT,
  personal_notes TEXT,
  relationship_stage TEXT CHECK (relationship_stage IN ('unknown', 'prospect', 'qualified_lead', 'opportunity', 'negotiation', 'customer', 'loyal_customer', 'advocate', 'at_risk', 'lost')) DEFAULT 'unknown',
  relationship_score INTEGER DEFAULT 0 CHECK (relationship_score >= 0 AND relationship_score <= 100),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
  -- Behavioral Profile (JSONB for flexibility)
  behavior JSONB DEFAULT '{
    "discProfile": null,
    "discConfidence": 0,
    "preferredChannel": "whatsapp",
    "formalityLevel": 3,
    "decisionCriteria": [],
    "needsApproval": false,
    "decisionPower": 5,
    "supportLevel": 5,
    "influencedByIds": [],
    "influencesIds": [],
    "currentChallenges": [],
    "competitorsUsed": []
  }'::jsonb,
  life_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts

-- policy Users can view their own contacts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Users can view their own contacts') THEN
    CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts

-- policy Users can insert their own contacts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Users can insert their own contacts') THEN
    CREATE POLICY "Users can insert their own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts

-- policy Users can update their own contacts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Users can update their own contacts') THEN
    CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts

-- policy Users can delete their own contacts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Users can delete their own contacts') THEN
    CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

-- 4. INTERACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('whatsapp', 'call', 'email', 'meeting', 'note', 'social')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  audio_url TEXT,
  transcription TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
  tags TEXT[] DEFAULT '{}',
  duration INTEGER, -- in seconds
  attachments TEXT[] DEFAULT '{}',
  initiated_by TEXT CHECK (initiated_by IN ('us', 'them')) DEFAULT 'us',
  response_time INTEGER, -- in minutes
  key_insights TEXT[] DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  emotion_analysis JSONB, -- For Hume AI results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.interactions ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own interactions" ON public.interactions

-- policy Users can view their own interactions (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can view their own interactions') THEN
    CREATE POLICY "Users can view their own interactions"
  ON public.interactions FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions

-- policy Users can insert their own interactions (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can insert their own interactions') THEN
    CREATE POLICY "Users can insert their own interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions

-- policy Users can update their own interactions (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can update their own interactions') THEN
    CREATE POLICY "Users can update their own interactions"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions

-- policy Users can delete their own interactions (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can delete their own interactions') THEN
    CREATE POLICY "Users can delete their own interactions"
  ON public.interactions FOR DELETE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

-- 5. INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN ('personality', 'preference', 'behavior', 'opportunity', 'risk', 'relationship')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  source TEXT,
  actionable BOOLEAN DEFAULT FALSE,
  action_suggestion TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.insights ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own insights" ON public.insights

-- policy Users can view their own insights (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insights' AND policyname='Users can view their own insights') THEN
    CREATE POLICY "Users can view their own insights"
  ON public.insights FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own insights" ON public.insights

-- policy Users can insert their own insights (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insights' AND policyname='Users can insert their own insights') THEN
    CREATE POLICY "Users can insert their own insights"
  ON public.insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can update their own insights" ON public.insights

-- policy Users can update their own insights (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insights' AND policyname='Users can update their own insights') THEN
    CREATE POLICY "Users can update their own insights"
  ON public.insights FOR UPDATE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can delete their own insights" ON public.insights

-- policy Users can delete their own insights (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='insights' AND policyname='Users can delete their own insights') THEN
    CREATE POLICY "Users can delete their own insights"
  ON public.insights FOR DELETE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

-- 6. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('birthday', 'no_contact', 'sentiment_drop', 'opportunity', 'follow_up', 'life_event')) NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  action_url TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts

-- policy Users can view their own alerts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alerts' AND policyname='Users can view their own alerts') THEN
    CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own alerts" ON public.alerts

-- policy Users can insert their own alerts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alerts' AND policyname='Users can insert their own alerts') THEN
    CREATE POLICY "Users can insert their own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts

-- policy Users can update their own alerts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alerts' AND policyname='Users can update their own alerts') THEN
    CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.alerts

-- policy Users can delete their own alerts (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='alerts' AND policyname='Users can delete their own alerts') THEN
    CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id);
  END IF;
END $pol$

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('company_created', 'contact_created', 'interaction_added', 'insight_generated', 'tag_added', 'profile_updated', 'alert_triggered')) NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('company', 'contact', 'interaction', 'insight', 'alert')) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
)

ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY

DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities

-- policy Users can view their own activities (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activities' AND policyname='Users can view their own activities') THEN
    CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);
  END IF;
END $pol$

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities

-- policy Users can insert their own activities (idempotente)
DO $pol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activities' AND policyname='Users can insert their own activities') THEN
    CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  END IF;
END $pol$

-- Trigger to create profile on user signup (idempotente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()

-- 8. INDEXES for performance (idempotentes)
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id)

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id)

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id)

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id)

CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions(contact_id)

CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC)

CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id)

CREATE INDEX IF NOT EXISTS idx_insights_contact_id ON public.insights(contact_id)

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id)

CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON public.alerts(dismissed) WHERE dismissed = FALSE

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id)

CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC)

-- 9. Updated_at trigger function + triggers (idempotentes)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()

-- ============ BASELINE (57 tabelas-base) ============
-- BASELINE das tabelas-base que ja existiam em producao antes de 2026-01-09.
-- Recuperado de producao (pgxfvjmuubtbowutlide) via information_schema/pg_constraint/pg_indexes,
-- fiel ao DDL real: colunas, defaults, PK/UNIQUE/FK, checks e indices.
-- Objetivo: destravar o Supabase Preview da #267, que aplica o range 20260109..20261118
-- sobre um banco vazio e falha porque tabelas-base aqui so existiam em producao.
DO $baseline$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='phone_type') THEN
    CREATE TYPE public.phone_type AS ENUM ('celular_corporativo','fixo_comercial','celular_pessoal','invalido');
  END IF;
END $baseline$

DO $baseline$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='email_type') THEN
    CREATE TYPE public.email_type AS ENUM ('corporativo','pessoal','financeiro','nfe','marketing','comercial','compras');
  END IF;
END $baseline$

DO $baseline$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='social_media_platform') THEN
    CREATE TYPE public.social_media_platform AS ENUM ('linkedin','instagram','facebook','x','youtube','tiktok','whatsapp','google_business','website');
  END IF;
END $baseline$

DO $baseline$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='workspace_account_type') THEN
    CREATE TYPE public.workspace_account_type AS ENUM ('user','group','alias','shared_mailbox','service_account');
  END IF;
END $baseline$

DO $baseline$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='data_source') THEN
    CREATE TYPE public.data_source AS ENUM ('CRM','SPA_CLIENTE','SPA_FORNECEDOR','SPA_TRANSPORTADORA','MERGED','MANUAL','LINKEDIN','LUSHA','LEADCONTACT','WHATSAPP');
  END IF;
END $baseline$

-- Funcao de trigger existente em producao antes do baseline (usada por triggers do range antes de sua definicao).
CREATE OR REPLACE FUNCTION public.trg_normalizar_telefone_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  nn         TEXT;
  eh_celular BOOLEAN;
BEGIN
  IF NEW.numero IS NOT NULL AND NEW.numero <> '' THEN
    nn := regexp_replace(NEW.numero, '[^0-9]', '', 'g');
  ELSE
    nn := regexp_replace(COALESCE(NEW.numero_normalizado, ''), '[^0-9]', '', 'g');
  END IF;

  IF nn = '' THEN RETURN NEW; END IF;

  -- Remover DDI 55 duplicado
  IF length(nn) >= 12 AND left(nn, 2) = '55' THEN
    nn := substring(nn FROM 3);
  END IF;

  -- Validação de comprimento
  IF length(nn) < 8 OR length(nn) > 13 THEN
    RAISE EXCEPTION 'Número de telefone inválido: "%" — deve ter entre 8 e 13 dígitos (recebido: % dígitos)',
      COALESCE(NEW.numero, NEW.numero_normalizado), length(nn);
  END IF;

  NEW.numero_normalizado := nn;
  NEW.numero_e164        := '+55' || nn;

  eh_celular := (length(nn) = 11 AND substring(nn FROM 3 FOR 1) = '9');

  IF TG_OP = 'INSERT' OR
     (TG_OP = 'UPDATE' AND OLD.numero IS DISTINCT FROM NEW.numero)
  THEN
    IF eh_celular THEN
      NEW.phone_type  := 'celular_corporativo'::phone_type;
      NEW.is_whatsapp := true;
    ELSE
      NEW.phone_type  := 'fixo_comercial'::phone_type;
      NEW.is_whatsapp := COALESCE(NEW.is_whatsapp, false);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$

-- Funcao de trigger existente em producao antes do baseline (usada por triggers do range antes de sua definicao).
CREATE OR REPLACE FUNCTION public.trg_normalizar_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  email_clean TEXT;
  local_part TEXT;
  domain_part TEXT;
  dominios_pessoais TEXT[] := ARRAY[
    'gmail.com', 'gmail.com.br',
    'hotmail.com', 'hotmail.com.br',
    'outlook.com', 'outlook.com.br',
    'yahoo.com', 'yahoo.com.br',
    'live.com', 'live.com.br',
    'msn.com', 'msn.com.br',
    'icloud.com',
    'protonmail.com', 'proton.me',
    'uol.com.br', 'bol.com.br',
    'terra.com.br', 'ig.com.br',
    'globo.com', 'globomail.com',
    'zipmail.com.br', 'oi.com.br',
    'r7.com', 'aol.com'
  ];
  patterns_nfe TEXT[] := ARRAY[
    'nfe', 'nf-e', 'nf_e', 'fiscal', 'xml', 'sped', 
    'notafiscal', 'nota_fiscal', 'nota-fiscal', 'danfe'
  ];
  patterns_financeiro TEXT[] := ARRAY[
    'financeiro', 'financ', 'contas', 'pagamento', 'cobranca', 
    'boleto', 'fatura', 'tesouraria', 'contabil', 'contabilidade'
  ];
  patterns_comercial TEXT[] := ARRAY[
    'comercial', 'vendas', 'venda', 'negocio', 'negocios',
    'atendimento', 'sac', 'ouvidoria', 'relacionamento'
  ];
  patterns_compras TEXT[] := ARRAY[
    'compras', 'compra', 'cotacao', 'cotacoes', 'suprimentos',
    'suprimento', 'almoxarifado', 'procurement', 'purchasing'
  ];
  patterns_marketing TEXT[] := ARRAY[
    'marketing', 'mkt', 'comunicacao', 'propaganda', 
    'midia', 'publicidade', 'endomarketing', 'digital'
  ];
  p TEXT;
BEGIN
  -- Se email está vazio, não faz nada
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  -- 1. LIMPAR: trim + lowercase
  email_clean := LOWER(TRIM(NEW.email));
  NEW.email := email_clean;

  -- 2. NORMALIZAR
  NEW.email_normalizado := email_clean;

  -- Se não tem @, retornar sem classificar
  IF position('@' in email_clean) = 0 THEN
    RETURN NEW;
  END IF;

  -- Separar local e domínio
  local_part := split_part(email_clean, '@', 1);
  domain_part := split_part(email_clean, '@', 2);

  -- 3. CLASSIFICAR email_type (só em INSERT ou se email mudou)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email != NEW.email) THEN

    -- 3a. Domínio pessoal?
    IF domain_part = ANY(dominios_pessoais) THEN
      NEW.email_type := 'pessoal'::email_type;
      RETURN NEW;
    END IF;

    -- 3b. NFe?
    FOREACH p IN ARRAY patterns_nfe LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'nfe'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3c. Financeiro?
    FOREACH p IN ARRAY patterns_financeiro LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'financeiro'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3d. Compras? (ANTES de comercial, pois é mais específico)
    FOREACH p IN ARRAY patterns_compras LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'compras'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3e. Comercial?
    FOREACH p IN ARRAY patterns_comercial LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'comercial'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3f. Marketing?
    FOREACH p IN ARRAY patterns_marketing LOOP
      IF local_part LIKE '%' || p || '%' THEN
        NEW.email_type := 'marketing'::email_type;
        RETURN NEW;
      END IF;
    END LOOP;

    -- 3g. Default: corporativo
    NEW.email_type := 'corporativo'::email_type;

  END IF;

  RETURN NEW;
END;
$function$

-- Funcao de trigger existente em producao antes do baseline (usada por triggers do range antes de sua definicao).
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT activity_feed_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_entity text,
  trigger_event text,
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active bool DEFAULT true,
  run_count int4 DEFAULT 0,
  last_run_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT automations_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  points int4 DEFAULT 0,
  criteria jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id),
  CONSTRAINT badges_code_key UNIQUE (code)
)

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'meeting'::text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  all_day bool DEFAULT false,
  company_id uuid,
  contact_id uuid,
  deal_id uuid,
  user_id uuid,
  location text,
  video_link text,
  status text DEFAULT 'scheduled'::text,
  reminder_minutes int4 DEFAULT 30,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text DEFAULT 'email'::text,
  status text DEFAULT 'draft'::text,
  target_segment_id uuid,
  start_date date,
  end_date date,
  budget numeric DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.carriers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo_transporte text,
  grupo_economico text,
  estados_atendidos _text,
  cidades_atendidas _text,
  prazo_por_trecho jsonb,
  tipo_frete text,
  tabela_frete jsonb,
  transportadora_validada bool DEFAULT false,
  data_validacao date,
  ultimo_transporte date,
  observacoes text,
  spa_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT carriers_pkey PRIMARY KEY (id),
  CONSTRAINT carriers_company_id_key UNIQUE (company_id)
)

CREATE TABLE IF NOT EXISTS public.churn_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  company_id uuid,
  user_id uuid NOT NULL,
  churn_probability numeric NOT NULL,
  confidence_level numeric DEFAULT 50,
  risk_level varchar NOT NULL,
  recency_factor numeric,
  frequency_factor numeric,
  engagement_factor numeric,
  sentiment_factor numeric,
  risk_factors jsonb,
  recommended_actions _text,
  predicted_at timestamptz DEFAULT now(),
  valid_until timestamptz DEFAULT (now() + '30 days'::interval),
  is_current bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT churn_predictions_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.cnaes (
  codigo varchar NOT NULL,
  descricao text NOT NULL,
  secao bpchar,
  divisao varchar,
  grupo varchar,
  classe varchar,
  subclasse varchar,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT cnaes_pkey PRIMARY KEY (codigo)
)

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  base_percentage numeric DEFAULT 0,
  tiers jsonb DEFAULT '[]'::jsonb,
  applies_to text DEFAULT 'all'::text,
  min_deal_value numeric DEFAULT 0,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT commission_rules_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deal_id uuid,
  rule_id uuid,
  deal_value numeric NOT NULL,
  commission_pct numeric NOT NULL,
  commission_value numeric NOT NULL,
  status text DEFAULT 'pending'::text,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT commissions_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.company_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo text DEFAULT '''Comercial|Faturamento''::character varying'::character varying,
  is_primary bool DEFAULT false,
  cep varchar,
  logradouro varchar,
  numero varchar,
  complemento text,
  bairro text,
  cidade text,
  estado varchar,
  pais varchar DEFAULT 'Brasil'::character varying,
  latitude numeric,
  longitude numeric,
  ponto_referencia varchar,
  instrucoes_entrega text,
  horario_funcionamento text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  google_maps_url text,
  google_place_id text,
  origem varchar,
  cidade_ibge int4,
  tipo_logradouro varchar,
  CONSTRAINT company_addresses_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.company_cnaes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  cnae_codigo varchar NOT NULL,
  is_principal bool DEFAULT false,
  origem varchar DEFAULT 'manual'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_cnaes_pkey PRIMARY KEY (id),
  CONSTRAINT company_cnaes_company_id_cnae_codigo_key UNIQUE (company_id, cnae_codigo)
)

CREATE TABLE IF NOT EXISTS public.company_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  email_type email_type DEFAULT 'corporativo'::email_type,
  email varchar NOT NULL,
  email_normalizado varchar,
  is_primary bool DEFAULT false,
  departamento varchar,
  observacao varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  fonte varchar,
  contexto varchar,
  confiabilidade int2,
  is_verified bool DEFAULT false,
  CONSTRAINT company_emails_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.company_phones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  phone_type phone_type DEFAULT 'fixo_comercial'::phone_type,
  numero varchar NOT NULL,
  numero_normalizado varchar NOT NULL,
  ramal varchar,
  is_primary bool DEFAULT false,
  is_whatsapp bool DEFAULT false,
  departamento varchar,
  observacao varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  numero_e164 varchar,
  fonte varchar,
  contexto varchar,
  confiabilidade int2,
  CONSTRAINT company_phones_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.company_rfm_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  last_interaction_date timestamptz,
  interaction_count int4 DEFAULT 0,
  total_value numeric DEFAULT 0,
  recency_score int4,
  frequency_score int4,
  monetary_score int4,
  combined_score numeric,
  segment_id uuid,
  segment_code text,
  overall_trend text,
  contacts_count int4 DEFAULT 0,
  avg_contact_score numeric,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_rfm_scores_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.company_social_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plataforma social_media_platform NOT NULL,
  handle varchar,
  url varchar,
  nome_perfil varchar,
  is_verified bool DEFAULT false,
  is_active bool DEFAULT true,
  seguidores int4,
  data_ultima_verificacao date,
  observacoes text,
  origem varchar DEFAULT 'manual'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT company_social_media_pkey PRIMARY KEY (id),
  CONSTRAINT uq_company_social_media UNIQUE (company_id, plataforma)
)

CREATE TABLE IF NOT EXISTS public.company_stakeholder_map (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  buying_role text,
  power_level int4 DEFAULT 5,
  interest_level int4 DEFAULT 5,
  stance text,
  access_level text,
  access_via_contact_id uuid,
  engagement_priority text,
  engagement_strategy text,
  notes text,
  analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_stakeholder_map_pkey PRIMARY KEY (id),
  CONSTRAINT company_stakeholder_map_company_id_contact_id_key UNIQUE (company_id, contact_id)
)

CREATE TABLE IF NOT EXISTS public.contact_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  email_type email_type DEFAULT 'corporativo'::email_type,
  email varchar NOT NULL,
  email_normalizado varchar,
  is_primary bool DEFAULT false,
  is_verified bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  fonte varchar,
  contexto varchar,
  confiabilidade int2 DEFAULT 0,
  CONSTRAINT contact_emails_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.contact_phones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  phone_type phone_type DEFAULT 'fixo_comercial'::phone_type,
  numero_normalizado varchar NOT NULL,
  is_primary bool DEFAULT false,
  is_whatsapp bool DEFAULT false,
  is_verified bool DEFAULT false,
  observacao varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  numero_e164 varchar,
  fonte varchar,
  contexto varchar,
  confiabilidade int2,
  numero varchar NOT NULL,
  CONSTRAINT contact_phones_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.contact_social_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  plataforma social_media_platform NOT NULL,
  handle varchar,
  url varchar,
  nome_perfil varchar,
  is_verified bool DEFAULT false,
  is_active bool DEFAULT true,
  observacoes text,
  origem varchar DEFAULT 'manual'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  fonte text,
  contexto text,
  confiabilidade int2 DEFAULT 0,
  CONSTRAINT contact_social_media_pkey PRIMARY KEY (id),
  CONSTRAINT uq_contact_social_media UNIQUE (contact_id, plataforma)
)

CREATE TABLE IF NOT EXISTS public.deal_competitors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deal_id uuid,
  competitor_id uuid,
  status text DEFAULT 'competing'::text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT deal_competitors_pkey PRIMARY KEY (id),
  CONSTRAINT deal_competitors_deal_id_competitor_id_key UNIQUE (deal_id, competitor_id)
)

CREATE TABLE IF NOT EXISTS public.deal_velocity_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid,
  company_id uuid,
  user_id uuid NOT NULL,
  avg_days_to_close numeric,
  current_deal_age int4,
  stage_velocity jsonb,
  vs_team_avg numeric,
  vs_segment_avg numeric,
  velocity_rating varchar,
  bottleneck_stage varchar,
  recommended_actions _text,
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT deal_velocity_analysis_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.disc_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  disc_type varchar NOT NULL,
  template_type varchar NOT NULL,
  title varchar NOT NULL,
  content text NOT NULL,
  tone varchar,
  key_phrases _text,
  avoid_phrases _text,
  example_subject varchar,
  is_active bool DEFAULT true,
  success_rate numeric DEFAULT 0,
  usage_count int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  CONSTRAINT disc_templates_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.economic_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  main_company_id uuid,
  total_revenue numeric DEFAULT 0,
  total_companies int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT economic_groups_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_entity_type_entity_id_key UNIQUE (user_id, entity_type, entity_id)
)

CREATE TABLE IF NOT EXISTS public.grupos_economicos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text,
  tipo text,
  bitrix_enum_id int4,
  descricao text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT grupos_economicos_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.interaction_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  subject text,
  content text,
  tags _text DEFAULT ARRAY[]::text[],
  is_public bool DEFAULT false,
  user_id uuid,
  usage_count int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  variables jsonb DEFAULT '[]'::jsonb,
  for_stage text,
  auto_suggest bool DEFAULT false,
  CONSTRAINT interaction_templates_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome varchar NOT NULL,
  descricao text,
  categoria varchar,
  custo_por_lead numeric,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT lead_sources_pkey PRIMARY KEY (id),
  CONSTRAINT lead_sources_nome_key UNIQUE (nome)
)

CREATE TABLE IF NOT EXISTS public.loss_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome varchar NOT NULL,
  descricao text,
  categoria varchar,
  is_active bool DEFAULT true,
  requer_detalhes bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT loss_reasons_pkey PRIMARY KEY (id),
  CONSTRAINT loss_reasons_nome_key UNIQUE (nome)
)

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  contact_id uuid,
  deal_id uuid,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  meeting_type text DEFAULT 'call'::text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int4 DEFAULT 30,
  status text DEFAULT 'scheduled'::text,
  meeting_url text,
  location text,
  notes text,
  outcome text,
  attendees jsonb DEFAULT '[]'::jsonb,
  reminders jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT meetings_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  contact_id uuid,
  deal_id uuid,
  user_id uuid NOT NULL,
  numero text,
  titulo text NOT NULL,
  descricao text,
  valor_total numeric DEFAULT 0,
  desconto_percentual numeric DEFAULT 0,
  valor_final numeric DEFAULT 0,
  status text DEFAULT 'rascunho'::text,
  validade_dias int4 DEFAULT 30,
  data_envio timestamptz,
  data_resposta timestamptz,
  motivo_rejeicao text,
  termos_condicoes text,
  itens jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  discount_type text DEFAULT 'percentage'::text,
  CONSTRAINT proposals_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.quick_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid NOT NULL,
  content text NOT NULL,
  note_type text DEFAULT 'general'::text,
  is_pinned bool DEFAULT false,
  is_archived bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT quick_notes_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.relationship_score_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  score int4 NOT NULL,
  engagement_score int4,
  sentiment_score int4,
  recency_score int4,
  frequency_score int4,
  depth_score int4,
  previous_score int4,
  score_change int4,
  stage text,
  previous_stage text,
  stage_changed bool DEFAULT false,
  trend text,
  change_reason text,
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT relationship_score_history_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid NOT NULL,
  title text NOT NULL,
  reminder_date timestamptz NOT NULL,
  reminder_type text DEFAULT 'general'::text,
  notes text,
  priority text DEFAULT 'medium'::text,
  is_completed bool DEFAULT false,
  completed_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT reminders_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.sales_cadences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_segment text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT sales_cadences_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.scheduled_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid NOT NULL,
  visit_date timestamptz NOT NULL,
  visit_type text DEFAULT 'commercial'::text,
  duration_minutes int4 DEFAULT 60,
  notes text,
  address_id uuid,
  status text DEFAULT 'scheduled'::text,
  completed_at timestamptz,
  completion_notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT scheduled_visits_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.seller_daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  metric_date date DEFAULT CURRENT_DATE,
  interactions_count int4 DEFAULT 0,
  calls_count int4 DEFAULT 0,
  emails_count int4 DEFAULT 0,
  whatsapp_count int4 DEFAULT 0,
  meetings_count int4 DEFAULT 0,
  deals_created int4 DEFAULT 0,
  deals_won int4 DEFAULT 0,
  deals_lost int4 DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  new_companies int4 DEFAULT 0,
  followups_completed int4 DEFAULT 0,
  avg_response_time_minutes int4,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT seller_daily_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT seller_daily_metrics_user_id_metric_date_key UNIQUE (user_id, metric_date)
)

CREATE TABLE IF NOT EXISTS public.sla_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  entity_type text NOT NULL,
  trigger_condition jsonb NOT NULL,
  response_time_hours int4 NOT NULL,
  escalation_levels jsonb DEFAULT '[]'::jsonb,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sla_rules_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.sla_violations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sla_rule_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL,
  expected_at timestamptz NOT NULL,
  resolved_at timestamptz,
  is_resolved bool DEFAULT false,
  escalation_level int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sla_violations_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  categoria text,
  tipo_fornecedor text,
  ramo_atividade text,
  grupo_economico text,
  produtos _text,
  servicos _text,
  api_url text,
  tem_integracao bool DEFAULT false,
  perfil_preco text,
  perfil_qualidade text,
  perfil_prazo text,
  prazo_entrega_medio int4,
  pedido_minimo numeric,
  forma_pagamento text,
  prazo_pagamento text,
  spa_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_company_id_key UNIQUE (company_id)
)

-- ============ SUPPLIERS HOMOLOGACAO ============
-- PROTETOR (preview): colunas de homologacao/qualificacao foram adicionadas
-- por migrations recuperadas de producao (20260329175449 e adjacentes) que no
-- preview ficaram registradas-sem-aplicar; a 0002 garante a base para as views
-- recriadas por essas migrations. Idempotente: no replay completo as colunas
-- ja existem quando a 0002 roda -> no-op.
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS homologado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_homologacao DATE,
  ADD COLUMN IF NOT EXISTS score_geral NUMERIC(5,2)

CREATE TABLE IF NOT EXISTS public.sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_type varchar NOT NULL,
  direction varchar NOT NULL,
  entity_id uuid,
  bitrix_id int4,
  status varchar NOT NULL,
  error_message text,
  records_processed int4 DEFAULT 0,
  records_created int4 DEFAULT 0,
  records_updated int4 DEFAULT 0,
  records_failed int4 DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sync_log_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.territories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  states _text,
  cities _text,
  manager_id uuid,
  is_active bool DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT territories_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.territory_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  territory_id uuid,
  user_id uuid NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  CONSTRAINT territory_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT territory_assignments_territory_id_user_id_key UNIQUE (territory_id, user_id)
)

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid,
  earned_at timestamptz DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id)
)

CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  period_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  is_achieved bool DEFAULT false,
  achieved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_goals_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.users (
  id int4 NOT NULL,
  name text NOT NULL,
  email text,
  cargo text,
  departamento text,
  is_active bool DEFAULT true,
  is_vendedor bool DEFAULT false,
  is_sdr bool DEFAULT false,
  bitrix_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  participa_rodizio_closer bool NOT NULL DEFAULT false,
  participa_rodizio_sdr bool NOT NULL DEFAULT false,
  ordem_rodizio int4,
  capacidade_max int4,
  afastado_ate date,
  CONSTRAINT users_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.workspace_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email varchar NOT NULL,
  email_normalizado varchar,
  display_name varchar,
  first_name varchar,
  last_name varchar,
  account_type workspace_account_type NOT NULL DEFAULT 'user'::workspace_account_type,
  department varchar,
  job_title varchar,
  is_active bool NOT NULL DEFAULT true,
  is_admin bool NOT NULL DEFAULT false,
  is_suspended bool NOT NULL DEFAULT false,
  aliases _text,
  google_id varchar,
  org_unit_path varchar,
  photo_url text,
  last_login_at timestamptz,
  creation_time timestamptz,
  members _text,
  member_count int4 DEFAULT 0,
  phones _text,
  recovery_email varchar,
  recovery_phone varchar,
  contact_id uuid,
  company_id uuid,
  user_id int4,
  metadata jsonb DEFAULT '{}'::jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT workspace_accounts_email_key UNIQUE (email),
  CONSTRAINT workspace_accounts_google_id_key UNIQUE (google_id)
)

CREATE TABLE IF NOT EXISTS public.cadence_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cadence_id uuid,
  company_id uuid,
  contact_id uuid,
  user_id uuid NOT NULL,
  current_step int4 DEFAULT 1,
  status text DEFAULT 'active'::text,
  next_action_at timestamptz,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT cadence_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT cadence_enrollments_cadence_id_company_id_key UNIQUE (cadence_id, company_id)
)

CREATE TABLE IF NOT EXISTS public.campaign_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  company_id uuid,
  contact_id uuid,
  status text DEFAULT 'pending'::text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT campaign_members_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.company_cadences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  cadence_id uuid NOT NULL,
  current_step int4 DEFAULT 1,
  started_at timestamptz DEFAULT now(),
  next_action_date date,
  status text DEFAULT 'active'::text,
  completed_at timestamptz,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_cadences_pkey PRIMARY KEY (id),
  CONSTRAINT company_cadences_company_id_cadence_id_key UNIQUE (company_id, cadence_id)
)

CREATE TABLE IF NOT EXISTS public.contact_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'profissional'::text,
  is_primary bool NOT NULL DEFAULT false,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado bpchar,
  pais text DEFAULT 'Brasil'::text,
  latitude float8,
  longitude float8,
  cidade_ibge int4,
  tipo_logradouro text,
  ponto_referencia text,
  google_maps_url text,
  google_place_id text,
  origem text DEFAULT 'manual'::text,
  fonte text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by int4,
  updated_by int4,
  CONSTRAINT contact_addresses_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.coop_sistemas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sigla varchar NOT NULL,
  tipo_sistema text NOT NULL DEFAULT 'COOPERATIVA_CREDITO'::text,
  total_cooperados int4,
  total_singulares int4,
  total_centrais int4,
  website text,
  logo_url text,
  grupo_economico_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT coop_sistemas_pkey PRIMARY KEY (id),
  CONSTRAINT coop_sistemas_sigla_key UNIQUE (sigla)
)

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  ramo_atividade text,
  grupo_clientes text,
  tipo_cooperativa text,
  perfil_preco text,
  perfil_qualidade text,
  perfil_prazo text,
  poder_compra text,
  cliente_ativado bool DEFAULT false,
  ja_comprou bool DEFAULT false,
  vendedor_id int4,
  data_entrada_carteira date,
  observacoes text,
  sobre text,
  spa_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  data_primeira_compra date,
  data_ultima_compra date,
  total_pedidos int4 DEFAULT 0,
  valor_total_compras numeric DEFAULT 0,
  sdr_id int4,
  data_atribuicao_sdr date,
  vendedor_nome text,
  sdr_nome text,
  data_ativacao date,
  ativado_por text,
  primeiro_ativador_id int4,
  primeiro_ativador_nome text,
  data_primeira_ativacao date,
  data_inativacao date,
  inativado_por_id int4,
  inativado_por_nome text,
  motivo_inativacao text,
  ticket_medio numeric DEFAULT 0,
  deleted_at timestamptz,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_company_id_key UNIQUE (company_id)
)

CREATE TABLE IF NOT EXISTS public.economic_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid,
  company_id uuid,
  role text DEFAULT 'member'::text,
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT economic_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT economic_group_members_group_id_company_id_key UNIQUE (group_id, company_id)
)

CREATE TABLE IF NOT EXISTS public.sdr_closer_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sdr_id int4 NOT NULL,
  closer_id int4 NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  criado_por_id int4,
  motivo_alteracao text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sdr_nome text,
  closer_nome text,
  ativo bool DEFAULT true,
  CONSTRAINT sdr_closer_assignments_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.customer_ownership_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vendedor_id int4 NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  registrado_por_id int4,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  company_id uuid,
  updated_at timestamptz DEFAULT now(),
  registrado_por_nome text,
  motivo_saida text,
  motivo_entrada text,
  vendedor_nome text,
  ciclo int4,
  posicao_no_ciclo int4,
  execucao_id uuid,
  CONSTRAINT customer_ownership_history_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.customer_sdr_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  sdr_id int4 NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  resultado text,
  closer_destino_id int4,
  data_passagem_closer date,
  qtd_tentativas_contato int4 DEFAULT 0,
  qtd_conversas int4 DEFAULT 0,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid,
  sdr_nome text,
  passed_to_closer_nome text,
  passed_to_closer_id int4,
  data_atribuicao date,
  ciclo int4,
  posicao_no_ciclo int4,
  execucao_id uuid,
  CONSTRAINT customer_sdr_history_pkey PRIMARY KEY (id)
)

-- automations_trigger_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automations_trigger_type_check') THEN
    ALTER TABLE ONLY public.automations ADD CONSTRAINT automations_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['event'::text, 'schedule'::text, 'condition'::text])));
  END IF;
END $cons$

-- badges_category_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'badges_category_check') THEN
    ALTER TABLE ONLY public.badges ADD CONSTRAINT badges_category_check CHECK ((category = ANY (ARRAY['sales'::text, 'engagement'::text, 'productivity'::text, 'milestone'::text, 'special'::text])));
  END IF;
END $cons$

-- chk_calendar_events_status (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_calendar_events_status') THEN
    ALTER TABLE ONLY public.calendar_events ADD CONSTRAINT chk_calendar_events_status CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'tentative'::text])));
  END IF;
END $cons$

-- chk_campaigns_status (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_campaigns_status') THEN
    ALTER TABLE ONLY public.campaigns ADD CONSTRAINT chk_campaigns_status CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text, 'archived'::text])));
  END IF;
END $cons$

-- chk_campaigns_type (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_campaigns_type') THEN
    ALTER TABLE ONLY public.campaigns ADD CONSTRAINT chk_campaigns_type CHECK ((type = ANY (ARRAY['email'::text, 'sms'::text, 'whatsapp'::text, 'push'::text, 'in_app'::text])));
  END IF;
END $cons$

-- commission_rules_applies_to_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_applies_to_check') THEN
    ALTER TABLE ONLY public.commission_rules ADD CONSTRAINT commission_rules_applies_to_check CHECK ((applies_to = ANY (ARRAY['all'::text, 'new_customers'::text, 'existing_customers'::text])));
  END IF;
END $cons$

-- commission_rules_rule_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commission_rules_rule_type_check') THEN
    ALTER TABLE ONLY public.commission_rules ADD CONSTRAINT commission_rules_rule_type_check CHECK ((rule_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'tiered'::text])));
  END IF;
END $cons$

-- commissions_status_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commissions_status_check') THEN
    ALTER TABLE ONLY public.commissions ADD CONSTRAINT commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])));
  END IF;
END $cons$

-- commissions_rule_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commissions_rule_id_fkey') THEN
    ALTER TABLE ONLY public.commissions ADD CONSTRAINT commissions_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES commission_rules(id);
  END IF;
END $cons$

-- company_cnaes_cnae_codigo_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_cnaes_cnae_codigo_fkey') THEN
    ALTER TABLE ONLY public.company_cnaes ADD CONSTRAINT company_cnaes_cnae_codigo_fkey FOREIGN KEY (cnae_codigo) REFERENCES cnaes(codigo);
  END IF;
END $cons$

-- company_rfm_scores_combined_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_combined_score_check') THEN
    ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_combined_score_check CHECK (((combined_score >= (1)::numeric) AND (combined_score <= (5)::numeric)));
  END IF;
END $cons$

-- company_rfm_scores_frequency_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_frequency_score_check') THEN
    ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_frequency_score_check CHECK (((frequency_score >= 1) AND (frequency_score <= 5)));
  END IF;
END $cons$

-- company_rfm_scores_monetary_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_monetary_score_check') THEN
    ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_monetary_score_check CHECK (((monetary_score >= 1) AND (monetary_score <= 5)));
  END IF;
END $cons$

-- company_rfm_scores_overall_trend_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_overall_trend_check') THEN
    ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_overall_trend_check CHECK ((overall_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text])));
  END IF;
END $cons$

-- company_rfm_scores_recency_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_rfm_scores_recency_score_check') THEN
    ALTER TABLE ONLY public.company_rfm_scores ADD CONSTRAINT company_rfm_scores_recency_score_check CHECK (((recency_score >= 1) AND (recency_score <= 5)));
  END IF;
END $cons$

-- company_stakeholder_map_access_level_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stakeholder_map_access_level_check') THEN
    ALTER TABLE ONLY public.company_stakeholder_map ADD CONSTRAINT company_stakeholder_map_access_level_check CHECK ((access_level = ANY (ARRAY['direct'::text, 'indirect'::text, 'no_access'::text, 'pending'::text])));
  END IF;
END $cons$

-- company_stakeholder_map_buying_role_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stakeholder_map_buying_role_check') THEN
    ALTER TABLE ONLY public.company_stakeholder_map ADD CONSTRAINT company_stakeholder_map_buying_role_check CHECK ((buying_role = ANY (ARRAY['economic_buyer'::text, 'technical_buyer'::text, 'user_buyer'::text, 'coach'::text, 'gatekeeper'::text, 'influencer'::text, 'blocker'::text, 'champion'::text, 'unknown'::text])));
  END IF;
END $cons$

-- company_stakeholder_map_engagement_priority_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stakeholder_map_engagement_priority_check') THEN
    ALTER TABLE ONLY public.company_stakeholder_map ADD CONSTRAINT company_stakeholder_map_engagement_priority_check CHECK ((engagement_priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text, 'monitor'::text])));
  END IF;
END $cons$

-- company_stakeholder_map_interest_level_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stakeholder_map_interest_level_check') THEN
    ALTER TABLE ONLY public.company_stakeholder_map ADD CONSTRAINT company_stakeholder_map_interest_level_check CHECK (((interest_level >= 0) AND (interest_level <= 10)));
  END IF;
END $cons$

-- company_stakeholder_map_power_level_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stakeholder_map_power_level_check') THEN
    ALTER TABLE ONLY public.company_stakeholder_map ADD CONSTRAINT company_stakeholder_map_power_level_check CHECK (((power_level >= 0) AND (power_level <= 10)));
  END IF;
END $cons$

-- company_stakeholder_map_stance_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_stakeholder_map_stance_check') THEN
    ALTER TABLE ONLY public.company_stakeholder_map ADD CONSTRAINT company_stakeholder_map_stance_check CHECK ((stance = ANY (ARRAY['strong_advocate'::text, 'advocate'::text, 'neutral'::text, 'skeptic'::text, 'blocker'::text])));
  END IF;
END $cons$

-- deal_competitors_status_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deal_competitors_status_check') THEN
    ALTER TABLE ONLY public.deal_competitors ADD CONSTRAINT deal_competitors_status_check CHECK ((status = ANY (ARRAY['competing'::text, 'won_against'::text, 'lost_to'::text])));
  END IF;
END $cons$

-- disc_templates_disc_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'disc_templates_disc_type_check') THEN
    ALTER TABLE ONLY public.disc_templates ADD CONSTRAINT disc_templates_disc_type_check CHECK (((disc_type)::text = ANY (ARRAY[('D'::character varying)::text, ('I'::character varying)::text, ('S'::character varying)::text, ('C'::character varying)::text])));
  END IF;
END $cons$

-- grupos_economicos_tipo_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grupos_economicos_tipo_check') THEN
    ALTER TABLE ONLY public.grupos_economicos ADD CONSTRAINT grupos_economicos_tipo_check CHECK ((tipo = ANY (ARRAY['HOLDING'::text, 'COOPERATIVA_CREDITO'::text, 'COOPERATIVA_AGRO'::text, 'REDE_FRANQUIAS'::text, 'GRUPO_FAMILIAR'::text, 'GRUPO_EMPRESARIAL'::text, 'MATRIZ_FILIAIS'::text])));
  END IF;
END $cons$

-- meetings_meeting_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meetings_meeting_type_check') THEN
    ALTER TABLE ONLY public.meetings ADD CONSTRAINT meetings_meeting_type_check CHECK ((meeting_type = ANY (ARRAY['call'::text, 'video'::text, 'presencial'::text])));
  END IF;
END $cons$

-- meetings_status_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meetings_status_check') THEN
    ALTER TABLE ONLY public.meetings ADD CONSTRAINT meetings_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])));
  END IF;
END $cons$

-- proposals_discount_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proposals_discount_type_check') THEN
    ALTER TABLE ONLY public.proposals ADD CONSTRAINT proposals_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));
  END IF;
END $cons$

-- proposals_status_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proposals_status_check') THEN
    ALTER TABLE ONLY public.proposals ADD CONSTRAINT proposals_status_check CHECK ((status = ANY (ARRAY['rascunho'::text, 'enviada'::text, 'visualizada'::text, 'aceita'::text, 'rejeitada'::text, 'expirada'::text])));
  END IF;
END $cons$

-- relationship_score_history_depth_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_depth_score_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_depth_score_check CHECK (((depth_score >= 0) AND (depth_score <= 100)));
  END IF;
END $cons$

-- relationship_score_history_engagement_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_engagement_score_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_engagement_score_check CHECK (((engagement_score >= 0) AND (engagement_score <= 100)));
  END IF;
END $cons$

-- relationship_score_history_frequency_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_frequency_score_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_frequency_score_check CHECK (((frequency_score >= 0) AND (frequency_score <= 100)));
  END IF;
END $cons$

-- relationship_score_history_recency_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_recency_score_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_recency_score_check CHECK (((recency_score >= 0) AND (recency_score <= 100)));
  END IF;
END $cons$

-- relationship_score_history_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_score_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_score_check CHECK (((score >= 0) AND (score <= 100)));
  END IF;
END $cons$

-- relationship_score_history_sentiment_score_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_sentiment_score_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_sentiment_score_check CHECK (((sentiment_score >= 0) AND (sentiment_score <= 100)));
  END IF;
END $cons$

-- relationship_score_history_trend_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relationship_score_history_trend_check') THEN
    ALTER TABLE ONLY public.relationship_score_history ADD CONSTRAINT relationship_score_history_trend_check CHECK ((trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text])));
  END IF;
END $cons$

-- chk_reminders_priority (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reminders_priority') THEN
    ALTER TABLE ONLY public.reminders ADD CONSTRAINT chk_reminders_priority CHECK ((priority = ANY (ARRAY['alta'::text, 'media'::text, 'baixa'::text, 'urgente'::text])));
  END IF;
END $cons$

-- chk_scheduled_visits_status (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_scheduled_visits_status') THEN
    ALTER TABLE ONLY public.scheduled_visits ADD CONSTRAINT chk_scheduled_visits_status CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'rescheduled'::text])));
  END IF;
END $cons$

-- sla_rules_entity_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sla_rules_entity_type_check') THEN
    ALTER TABLE ONLY public.sla_rules ADD CONSTRAINT sla_rules_entity_type_check CHECK ((entity_type = ANY (ARRAY['company'::text, 'deal'::text, 'interaction'::text, 'proposal'::text])));
  END IF;
END $cons$

-- sla_violations_sla_rule_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sla_violations_sla_rule_id_fkey') THEN
    ALTER TABLE ONLY public.sla_violations ADD CONSTRAINT sla_violations_sla_rule_id_fkey FOREIGN KEY (sla_rule_id) REFERENCES sla_rules(id);
  END IF;
END $cons$

-- territory_assignments_territory_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territory_assignments_territory_id_fkey') THEN
    ALTER TABLE ONLY public.territory_assignments ADD CONSTRAINT territory_assignments_territory_id_fkey FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- user_badges_badge_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_badges_badge_id_fkey') THEN
    ALTER TABLE ONLY public.user_badges ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- user_goals_goal_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_goals_goal_type_check') THEN
    ALTER TABLE ONLY public.user_goals ADD CONSTRAINT user_goals_goal_type_check CHECK ((goal_type = ANY (ARRAY['deals_count'::text, 'deals_value'::text, 'interactions'::text, 'new_companies'::text, 'proposals'::text])));
  END IF;
END $cons$

-- user_goals_period_type_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_goals_period_type_check') THEN
    ALTER TABLE ONLY public.user_goals ADD CONSTRAINT user_goals_period_type_check CHECK ((period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])));
  END IF;
END $cons$

-- cadence_enrollments_status_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cadence_enrollments_status_check') THEN
    ALTER TABLE ONLY public.cadence_enrollments ADD CONSTRAINT cadence_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'replied'::text, 'bounced'::text, 'opted_out'::text])));
  END IF;
END $cons$

-- cadence_enrollments_cadence_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cadence_enrollments_cadence_id_fkey') THEN
    ALTER TABLE ONLY public.cadence_enrollments ADD CONSTRAINT cadence_enrollments_cadence_id_fkey FOREIGN KEY (cadence_id) REFERENCES sales_cadences(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- chk_campaign_members_status (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_campaign_members_status') THEN
    ALTER TABLE ONLY public.campaign_members ADD CONSTRAINT chk_campaign_members_status CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'bounced'::text, 'unsubscribed'::text, 'opted_out'::text])));
  END IF;
END $cons$

-- campaign_members_campaign_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_members_campaign_id_fkey') THEN
    ALTER TABLE ONLY public.campaign_members ADD CONSTRAINT campaign_members_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- chk_company_cadences_status (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_company_cadences_status') THEN
    ALTER TABLE ONLY public.company_cadences ADD CONSTRAINT chk_company_cadences_status CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'archived'::text])));
  END IF;
END $cons$

-- company_cadences_cadence_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_cadences_cadence_id_fkey') THEN
    ALTER TABLE ONLY public.company_cadences ADD CONSTRAINT company_cadences_cadence_id_fkey FOREIGN KEY (cadence_id) REFERENCES sales_cadences(id);
  END IF;
END $cons$

-- contact_addresses_tipo_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_addresses_tipo_check') THEN
    ALTER TABLE ONLY public.contact_addresses ADD CONSTRAINT contact_addresses_tipo_check CHECK ((tipo = ANY (ARRAY['residencial'::text, 'profissional'::text, 'cobranca'::text, 'outro'::text])));
  END IF;
END $cons$

-- contact_addresses_created_by_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_addresses_created_by_fkey') THEN
    ALTER TABLE ONLY public.contact_addresses ADD CONSTRAINT contact_addresses_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
  END IF;
END $cons$

-- contact_addresses_updated_by_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_addresses_updated_by_fkey') THEN
    ALTER TABLE ONLY public.contact_addresses ADD CONSTRAINT contact_addresses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id);
  END IF;
END $cons$

-- coop_sistemas_grupo_economico_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coop_sistemas_grupo_economico_id_fkey') THEN
    ALTER TABLE ONLY public.coop_sistemas ADD CONSTRAINT coop_sistemas_grupo_economico_id_fkey FOREIGN KEY (grupo_economico_id) REFERENCES grupos_economicos(id);
  END IF;
END $cons$

-- chk_customers_ticket_medio (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_customers_ticket_medio') THEN
    ALTER TABLE ONLY public.customers ADD CONSTRAINT chk_customers_ticket_medio CHECK (((ticket_medio IS NULL) OR (ticket_medio >= (0)::numeric)));
  END IF;
END $cons$

-- chk_customers_valor_total (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_customers_valor_total') THEN
    ALTER TABLE ONLY public.customers ADD CONSTRAINT chk_customers_valor_total CHECK (((valor_total_compras IS NULL) OR (valor_total_compras >= (0)::numeric)));
  END IF;
END $cons$

-- customers_sdr_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_sdr_id_fkey') THEN
    ALTER TABLE ONLY public.customers ADD CONSTRAINT customers_sdr_id_fkey FOREIGN KEY (sdr_id) REFERENCES users(id);
  END IF;
END $cons$

-- customers_vendedor_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_vendedor_id_fkey') THEN
    ALTER TABLE ONLY public.customers ADD CONSTRAINT customers_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES users(id);
  END IF;
END $cons$

-- economic_group_members_group_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'economic_group_members_group_id_fkey') THEN
    ALTER TABLE ONLY public.economic_group_members ADD CONSTRAINT economic_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES economic_groups(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- check_sdr_closer_different (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_sdr_closer_different') THEN
    ALTER TABLE ONLY public.sdr_closer_assignments ADD CONSTRAINT check_sdr_closer_different CHECK ((sdr_id <> closer_id));
  END IF;
END $cons$

-- sdr_closer_assignments_closer_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sdr_closer_assignments_closer_id_fkey') THEN
    ALTER TABLE ONLY public.sdr_closer_assignments ADD CONSTRAINT sdr_closer_assignments_closer_id_fkey FOREIGN KEY (closer_id) REFERENCES users(id);
  END IF;
END $cons$

-- sdr_closer_assignments_criado_por_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sdr_closer_assignments_criado_por_id_fkey') THEN
    ALTER TABLE ONLY public.sdr_closer_assignments ADD CONSTRAINT sdr_closer_assignments_criado_por_id_fkey FOREIGN KEY (criado_por_id) REFERENCES users(id);
  END IF;
END $cons$

-- sdr_closer_assignments_sdr_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sdr_closer_assignments_sdr_id_fkey') THEN
    ALTER TABLE ONLY public.sdr_closer_assignments ADD CONSTRAINT sdr_closer_assignments_sdr_id_fkey FOREIGN KEY (sdr_id) REFERENCES users(id);
  END IF;
END $cons$

-- customer_ownership_history_customer_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_ownership_history_customer_id_fkey') THEN
    ALTER TABLE ONLY public.customer_ownership_history ADD CONSTRAINT customer_ownership_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- customer_ownership_history_registrado_por_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_ownership_history_registrado_por_id_fkey') THEN
    ALTER TABLE ONLY public.customer_ownership_history ADD CONSTRAINT customer_ownership_history_registrado_por_id_fkey FOREIGN KEY (registrado_por_id) REFERENCES users(id);
  END IF;
END $cons$

-- customer_ownership_history_vendedor_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_ownership_history_vendedor_id_fkey') THEN
    ALTER TABLE ONLY public.customer_ownership_history ADD CONSTRAINT customer_ownership_history_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES users(id);
  END IF;
END $cons$

-- customer_sdr_history_resultado_check (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_sdr_history_resultado_check') THEN
    ALTER TABLE ONLY public.customer_sdr_history ADD CONSTRAINT customer_sdr_history_resultado_check CHECK ((resultado = ANY (ARRAY['EM_ANDAMENTO'::text, 'QUALIFICADO'::text, 'REATIVADO'::text, 'SEM_INTERESSE'::text, 'SEM_CONTATO'::text, 'TRANSFERIDO'::text])));
  END IF;
END $cons$

-- customer_sdr_history_closer_destino_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_sdr_history_closer_destino_id_fkey') THEN
    ALTER TABLE ONLY public.customer_sdr_history ADD CONSTRAINT customer_sdr_history_closer_destino_id_fkey FOREIGN KEY (closer_destino_id) REFERENCES users(id);
  END IF;
END $cons$

-- customer_sdr_history_customer_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_sdr_history_customer_id_fkey') THEN
    ALTER TABLE ONLY public.customer_sdr_history ADD CONSTRAINT customer_sdr_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;
END $cons$

-- customer_sdr_history_sdr_id_fkey (idempotente)
DO $cons$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_sdr_history_sdr_id_fkey') THEN
    ALTER TABLE ONLY public.customer_sdr_history ADD CONSTRAINT customer_sdr_history_sdr_id_fkey FOREIGN KEY (sdr_id) REFERENCES users(id);
  END IF;
END $cons$

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_automations_created_by ON public.automations USING btree (created_by)

CREATE INDEX IF NOT EXISTS idx_calendar_company ON public.calendar_events USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_calendar_events_contact_id_fk ON public.calendar_events USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_calendar_events_deal_id ON public.calendar_events USING btree (deal_id)

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns USING btree (created_by)

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns USING btree (status)

CREATE INDEX IF NOT EXISTS idx_churn_predictions_company_id ON public.churn_predictions USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_churn_predictions_contact ON public.churn_predictions USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_churn_predictions_user_id ON public.churn_predictions USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_commissions_deal_id ON public.commissions USING btree (deal_id)

CREATE INDEX IF NOT EXISTS idx_commissions_rule_id ON public.commissions USING btree (rule_id)

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_company_addresses_cep ON public.company_addresses USING btree (cep)

CREATE INDEX IF NOT EXISTS idx_company_addresses_cidade ON public.company_addresses USING btree (cidade, estado)

CREATE INDEX IF NOT EXISTS idx_company_addresses_cidade_ibge ON public.company_addresses USING btree (cidade_ibge)

CREATE INDEX IF NOT EXISTS idx_company_addresses_company ON public.company_addresses USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_company_addresses_created_at ON public.company_addresses USING btree (created_at)

CREATE INDEX IF NOT EXISTS idx_company_addresses_primary ON public.company_addresses USING btree (company_id, is_primary)

CREATE INDEX IF NOT EXISTS idx_company_addresses_tipo_logradouro ON public.company_addresses USING btree (tipo_logradouro)

CREATE INDEX IF NOT EXISTS idx_company_cnaes_cnae ON public.company_cnaes USING btree (cnae_codigo)

CREATE INDEX IF NOT EXISTS idx_company_cnaes_company ON public.company_cnaes USING btree (company_id)

CREATE UNIQUE INDEX IF NOT EXISTS company_emails_company_id_lower_email_unique ON public.company_emails USING btree (company_id, lower((email)::text))

CREATE INDEX IF NOT EXISTS idx_company_emails_company_id ON public.company_emails USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_company_emails_email_lower ON public.company_emails USING btree (lower((email)::text))

CREATE INDEX IF NOT EXISTS idx_company_phones_created_at ON public.company_phones USING btree (created_at)

CREATE INDEX IF NOT EXISTS idx_company_phones_e164 ON public.company_phones USING btree (numero_e164) WHERE (numero_e164 IS NOT NULL)

CREATE INDEX IF NOT EXISTS idx_company_phones_normalizado ON public.company_phones USING btree (numero_normalizado)

CREATE INDEX IF NOT EXISTS idx_company_phones_whatsapp ON public.company_phones USING btree (company_id) WHERE (is_whatsapp = true)

CREATE INDEX IF NOT EXISTS idx_company_rfm_scores_created_at ON public.company_rfm_scores USING btree (created_at)

CREATE INDEX IF NOT EXISTS idx_company_rfm_scores_segment_id ON public.company_rfm_scores USING btree (segment_id)

CREATE INDEX IF NOT EXISTS idx_company_rfm_segment ON public.company_rfm_scores USING btree (segment_code)

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_rfm_unique ON public.company_rfm_scores USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_company_rfm_user ON public.company_rfm_scores USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_company_social_active ON public.company_social_media USING btree (company_id, plataforma) WHERE (is_active = true)

CREATE INDEX IF NOT EXISTS idx_company_social_company ON public.company_social_media USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_company_social_media_created_at ON public.company_social_media USING btree (created_at)

CREATE INDEX IF NOT EXISTS idx_company_social_plataforma ON public.company_social_media USING btree (plataforma)

CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_access_via_contact_id ON public.company_stakeholder_map USING btree (access_via_contact_id)

CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_company_id ON public.company_stakeholder_map USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_contact_id ON public.company_stakeholder_map USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_user_id ON public.company_stakeholder_map USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_contact_emails_contact_id ON public.contact_emails USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_contact_emails_primary ON public.contact_emails USING btree (contact_id) WHERE (is_primary = true)

CREATE INDEX IF NOT EXISTS idx_contact_phones_primary ON public.contact_phones USING btree (contact_id) WHERE (is_primary = true)

CREATE INDEX IF NOT EXISTS idx_contact_phones_whatsapp ON public.contact_phones USING btree (contact_id) WHERE (is_whatsapp = true)

CREATE INDEX IF NOT EXISTS idx_contact_social_contact ON public.contact_social_media USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_deal_competitors_competitor_id ON public.deal_competitors USING btree (competitor_id)

CREATE INDEX IF NOT EXISTS idx_deal_competitors_deal_id ON public.deal_competitors USING btree (deal_id)

CREATE INDEX IF NOT EXISTS idx_deal_velocity_analysis_company_id ON public.deal_velocity_analysis USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_deal_velocity_analysis_contact_id ON public.deal_velocity_analysis USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_deal_velocity_analysis_user_id ON public.deal_velocity_analysis USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_disc_templates_created_by ON public.disc_templates USING btree (created_by)

CREATE INDEX IF NOT EXISTS idx_economic_groups_main_company_id_fk ON public.economic_groups USING btree (main_company_id)

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites USING btree (user_id)

CREATE UNIQUE INDEX IF NOT EXISTS idx_grupo_nome ON public.grupos_economicos USING btree (nome)

CREATE INDEX IF NOT EXISTS idx_interaction_templates_user_id ON public.interaction_templates USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_meetings_company ON public.meetings USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_meetings_contact_id_fk ON public.meetings USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_meetings_deal_id ON public.meetings USING btree (deal_id)

CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_proposals_contact_id ON public.proposals USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_proposals_deal ON public.proposals USING btree (deal_id)

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals USING btree (status)

CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_quick_notes_company ON public.quick_notes USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_quick_notes_user_id ON public.quick_notes USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_relationship_score_history_contact_id ON public.relationship_score_history USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_relationship_score_history_contact_measured ON public.relationship_score_history USING btree (contact_id, measured_at DESC)

CREATE INDEX IF NOT EXISTS idx_relationship_score_history_user_id ON public.relationship_score_history USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_reminders_company ON public.reminders USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON public.reminders USING btree (user_id, reminder_date)

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_sales_cadences_created_by ON public.sales_cadences USING btree (created_by)

CREATE INDEX IF NOT EXISTS idx_scheduled_visits_company_id ON public.scheduled_visits USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_scheduled_visits_user_id ON public.scheduled_visits USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_visits_user_date ON public.scheduled_visits USING btree (user_id, visit_date)

CREATE INDEX IF NOT EXISTS idx_seller_daily_metrics_user_id ON public.seller_daily_metrics USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_sla_violations_sla_rule_id ON public.sla_violations USING btree (sla_rule_id)

CREATE INDEX IF NOT EXISTS idx_sla_violations_user_id ON public.sla_violations USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_sync_log_created ON public.sync_log USING btree (created_at DESC)

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON public.sync_log USING btree (status)

CREATE INDEX IF NOT EXISTS idx_sync_log_type ON public.sync_log USING btree (sync_type, direction)

CREATE INDEX IF NOT EXISTS idx_territories_manager_id ON public.territories USING btree (manager_id)

CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory_id ON public.territory_assignments USING btree (territory_id)

CREATE INDEX IF NOT EXISTS idx_territory_assignments_user_id ON public.territory_assignments USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges USING btree (badge_id)

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_user_goals_period ON public.user_goals USING btree (period_start, period_end)

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_cadence_id ON public.cadence_enrollments USING btree (cadence_id)

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_company_id_fk ON public.cadence_enrollments USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_contact_id_fk ON public.cadence_enrollments USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_user_id ON public.cadence_enrollments USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON public.campaign_members USING btree (campaign_id)

CREATE INDEX IF NOT EXISTS idx_campaign_members_company_id_fk ON public.campaign_members USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_campaign_members_contact_id_fk ON public.campaign_members USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_campaign_members_status ON public.campaign_members USING btree (status)

CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_members_campaign_contact ON public.campaign_members USING btree (campaign_id, contact_id) WHERE (contact_id IS NOT NULL)

CREATE INDEX IF NOT EXISTS idx_company_cadences_cadence_id ON public.company_cadences USING btree (cadence_id)

CREATE INDEX IF NOT EXISTS idx_company_cadences_company ON public.company_cadences USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_company_cadences_status ON public.company_cadences USING btree (status)

CREATE INDEX IF NOT EXISTS idx_company_cadences_user_id ON public.company_cadences USING btree (user_id)

CREATE INDEX IF NOT EXISTS idx_ca_contact ON public.contact_addresses USING btree (contact_id)

CREATE INDEX IF NOT EXISTS idx_contact_addresses_created_by ON public.contact_addresses USING btree (created_by)

CREATE INDEX IF NOT EXISTS idx_contact_addresses_updated_by ON public.contact_addresses USING btree (updated_by)

CREATE INDEX IF NOT EXISTS idx_coop_sistemas_grupo_economico_id ON public.coop_sistemas USING btree (grupo_economico_id)

CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers USING btree (id) WHERE (deleted_at IS NULL)

CREATE INDEX IF NOT EXISTS idx_customers_ativado ON public.customers USING btree (id) WHERE (cliente_ativado = true)

CREATE INDEX IF NOT EXISTS idx_customers_ja_comprou ON public.customers USING btree (id) WHERE (ja_comprou = true)

CREATE INDEX IF NOT EXISTS idx_customers_sdr_id ON public.customers USING btree (sdr_id)

CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON public.customers USING btree (updated_at)

CREATE INDEX IF NOT EXISTS idx_customers_vendedor ON public.customers USING btree (vendedor_id)

CREATE INDEX IF NOT EXISTS idx_customers_vendedor_ativo ON public.customers USING btree (vendedor_id, cliente_ativado) WHERE (deleted_at IS NULL)

CREATE INDEX IF NOT EXISTS idx_econ_group_members_company ON public.economic_group_members USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_economic_group_members_group_id ON public.economic_group_members USING btree (group_id)

CREATE INDEX IF NOT EXISTS idx_sdr_closer_assignments_criado_por_id ON public.sdr_closer_assignments USING btree (criado_por_id)

CREATE INDEX IF NOT EXISTS idx_sdr_closer_closer ON public.sdr_closer_assignments USING btree (closer_id)

CREATE INDEX IF NOT EXISTS idx_sdr_closer_sdr ON public.sdr_closer_assignments USING btree (sdr_id)

CREATE INDEX IF NOT EXISTS idx_customer_ownership_history_company_id ON public.customer_ownership_history USING btree (company_id)

CREATE INDEX IF NOT EXISTS idx_customer_ownership_history_customer_id ON public.customer_ownership_history USING btree (customer_id)

CREATE INDEX IF NOT EXISTS idx_customer_ownership_history_registrado_por_id ON public.customer_ownership_history USING btree (registrado_por_id)

CREATE INDEX IF NOT EXISTS idx_customer_ownership_history_vendedor_id ON public.customer_ownership_history USING btree (vendedor_id)

CREATE INDEX IF NOT EXISTS idx_customer_sdr_history_closer_destino_id ON public.customer_sdr_history USING btree (closer_destino_id)

CREATE INDEX IF NOT EXISTS idx_customer_sdr_history_customer_id ON public.customer_sdr_history USING btree (customer_id)

CREATE INDEX IF NOT EXISTS idx_customer_sdr_history_sdr_id ON public.customer_sdr_history USING btree (sdr_id)

CREATE INDEX IF NOT EXISTS idx_sdr_history_company ON public.customer_sdr_history USING btree (company_id)

-- ============ COMPAT (colunas extras + enums + funcoes) ============
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
END $$

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
  ADD COLUMN IF NOT EXISTS regime_tributario text

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
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 0

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
  ADD COLUMN IF NOT EXISTS bitrix_user_id integer

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
  ADD COLUMN IF NOT EXISTS outcome text

-- ============ ACTIVITIES ============
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS entity_name text,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS reason text

-- ============ INSIGHTS ============
ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS dismissed boolean,
  ADD COLUMN IF NOT EXISTS description text

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
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()

-- ============ PUSH_SUBSCRIPTIONS ============
-- PROTETOR (preview): o banco do preview tem migrations antigas registradas
-- sem aplicar; push_subscriptions pode nao existir quando a 0002 roda.
-- Recria o schema identico ao da 20260109173224 apenas quando ausente
-- (idempotente: no replay completo a tabela ja existe -> no-op).
DO $push_subscriptions_protector$
BEGIN
  IF to_regclass('public.push_subscriptions') IS NULL THEN
    CREATE TABLE public.push_subscriptions (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(user_id, endpoint)
    );
    ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view their own subscriptions"
      ON public.push_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
    CREATE POLICY "Users can create their own subscriptions"
      ON public.push_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own subscriptions"
      ON public.push_subscriptions FOR UPDATE
      USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own subscriptions"
      ON public.push_subscriptions FOR DELETE
      USING (auth.uid() = user_id);
    CREATE TRIGGER update_push_subscriptions_updated_at
      BEFORE UPDATE ON public.push_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $push_subscriptions_protector$

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()

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
END $$

-- ============ CONSTRAINTS ORFAOS (DROP CONSTRAINT sem IF EXISTS no repo) ============
-- Migrations recuperadas de producao fazem DROP CONSTRAINT de constraints que
-- existiam pre-jan/2026. Sem elas no replay/Preview o DROP falha (constraint
-- nao existe). Cada DO block cria a constraint so se ainda nao existir.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_departamento' AND conrelid='public.contacts'::regclass) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT chk_departamento
      CHECK (departamento IS NULL OR departamento = ANY (ARRAY['Compras','Marketing','RH','Diretoria','Financeiro','Comercial','Gest?o']));
  END IF;
END $$

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activities_type_check' AND conrelid='public.activities'::regclass) THEN
    ALTER TABLE public.activities ADD CONSTRAINT activities_type_check
      CHECK (type = ANY (ARRAY['contact_created','contact_updated','contact_deleted','contact_viewed','contact_merged','company_created','company_updated','company_deleted','company_viewed','interaction_created','interaction_updated','interaction_deleted','call_made','message_sent','email_sent','meeting_scheduled','note_added','disc_analyzed','sentiment_analyzed','emotion_analyzed','alert_created','alert_actioned','alert_dismissed','login','logout','settings_changed','export_data','import_data']));
  END IF;
END $$

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alerts_type_check' AND conrelid='public.alerts'::regclass) THEN
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_type_check
      CHECK (type = ANY (ARRAY['relationship_risk','follow_up_due','birthday_reminder','inactivity_warning','sentiment_drop','opportunity','disc_insight','life_event','engagement_spike','churn_risk','upsell_opportunity','referral_opportunity','system','custom','supplier_score_baixo','supplier_destaque','supplier_homologacao_vencendo','supplier_homologacao_vencida','supplier_nao_homologado','carrier_score_baixo','carrier_destaque','carrier_homologacao_vencendo','carrier_homologacao_vencida','carrier_nao_homologado']));
  END IF;
END $$

DO $$ BEGIN
  IF to_regclass('public.incoming_webhooks') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='incoming_webhooks_active_signature_check' AND conrelid='public.incoming_webhooks'::regclass) THEN
      ALTER TABLE public.incoming_webhooks ADD CONSTRAINT incoming_webhooks_active_signature_check
      CHECK ((NOT is_active) OR (require_signature AND (webhook_secret IS NOT NULL) AND (length(webhook_secret) >= 32)));
    END IF;
  END IF;
END $$

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='suppliers_company_id_fkey' AND conrelid='public.suppliers'::regclass) THEN
    ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;
  END IF;
END $$

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='carriers_company_id_fkey' AND conrelid='public.carriers'::regclass) THEN
    ALTER TABLE public.carriers ADD CONSTRAINT carriers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;
  END IF;
END $$

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customers_company_id_fkey' AND conrelid='public.customers'::regclass) THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;
  END IF;
END $$

DO $$ BEGIN
  IF to_regclass('public.sales') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sales_status_check' AND conrelid='public.sales'::regclass) THEN
      ALTER TABLE public.sales ADD CONSTRAINT sales_status_check
      CHECK (status = ANY (ARRAY['completed','pending','cancelled','negotiation','proposal','qualification','discovery','lead']));
    END IF;
  END IF;
END $$

DO $$ BEGIN
  IF to_regclass('public.sequence_enrollments') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sequence_enrollments_sequence_id_fkey' AND conrelid='public.sequence_enrollments'::regclass) THEN
      ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.sequences(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$

-- Tabela staging temporaria de producao (_stg_pac_nums), dropada em producao
-- mas usada por 20260320173453_stg_pac_ins_0 e 20260320174327_stg_pac_ins_1.
CREATE TABLE IF NOT EXISTS _stg_pac_nums (
  id UUID PRIMARY KEY,
  numero TEXT
)

-- Indice GIN de full-text search criado fora da cadeia de migrations (pre-existente
-- em producao): idx_companies_search sobre search_vector, usado por 20260321192746
-- (COMMENT ON INDEX) e dropado/semanticamente mantido depois.
CREATE INDEX IF NOT EXISTS idx_companies_search ON public.companies USING gin (search_vector)

-- ============================================================
-- STUBS de functions pre-existentes em producao (criadas fora da
-- cadeia de migrations recuperadas) ? necessarias para que o replay
-- das migrations de doc/comentario e triggers N?O quebre.
-- Assinaturas reais extra?das de producao (pg_proc).
-- Corpo neutro; implementacao real destas rotinas vive em
-- migrations posteriores ou fora do repo.
-- ============================================================
DROP FUNCTION IF EXISTS public.ativar_cliente(uuid, integer, text)

CREATE OR REPLACE FUNCTION public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$

DROP FUNCTION IF EXISTS public.inativar_cliente(uuid, text, integer, text)

CREATE OR REPLACE FUNCTION public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer, p_executado_por_nome text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$

DROP FUNCTION IF EXISTS public.transferir_cliente(uuid, integer, text, integer, text)

CREATE OR REPLACE FUNCTION public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$

DROP FUNCTION IF EXISTS public.registrar_compra(uuid, numeric, text, text)

CREATE OR REPLACE FUNCTION public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$

DROP FUNCTION IF EXISTS public.sdr_qualificar_cliente(uuid, integer, integer, text, text)

CREATE OR REPLACE FUNCTION public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)
RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN RETURN jsonb_build_object('ok', true); END; $$

CREATE OR REPLACE FUNCTION public.auto_preencher_nomes_contato()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$

CREATE OR REPLACE FUNCTION public.auto_atualizar_nomes_contato()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$

CREATE OR REPLACE FUNCTION public.update_company_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$

CREATE OR REPLACE FUNCTION public.update_contact_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS json LANGUAGE plpgsql AS $$ BEGIN RETURN '{}'::json; END; $$

CREATE OR REPLACE FUNCTION public.get_health_check()
RETURNS json LANGUAGE plpgsql AS $$ BEGIN RETURN '{"status":"ok"}'::json; END; $$

DROP FUNCTION IF EXISTS public.search_companies(text, integer)

CREATE OR REPLACE FUNCTION public.search_companies(search_term text, max_results integer)
RETURNS TABLE(id uuid, nome_fantasia text, razao_social text, cnpj text, status text, is_customer boolean)
LANGUAGE plpgsql AS $$ BEGIN
  RETURN QUERY SELECT NULL::uuid AS id, NULL::text AS nome_fantasia, NULL::text AS razao_social, NULL::text AS cnpj, NULL::text AS status, NULL::boolean AS is_customer LIMIT 0;
END; $$

DROP FUNCTION IF EXISTS public.search_contacts(text, integer)

CREATE OR REPLACE FUNCTION public.search_contacts(search_term text, max_results integer)
RETURNS TABLE(id uuid, full_name text, first_name text, last_name text, company_id uuid)
LANGUAGE plpgsql AS $$ BEGIN
  RETURN QUERY SELECT NULL::uuid AS id, NULL::text AS full_name, NULL::text AS first_name, NULL::text AS last_name, NULL::uuid AS company_id LIMIT 0;
END; $$

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
$$

-- Tabela pre-existente em producao (criada fora das migrations recuperadas).
CREATE SEQUENCE IF NOT EXISTS public.config_regras_negocio_id_seq

CREATE TABLE IF NOT EXISTS public.config_regras_negocio (
  id integer NOT NULL DEFAULT nextval('config_regras_negocio_id_seq'::regclass) PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  valor text NOT NULL,
  descricao text,
  updated_at timestamp with time zone DEFAULT now()
)

ALTER SEQUENCE public.config_regras_negocio_id_seq OWNED BY public.config_regras_negocio.id

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
)

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
END $storage_block$

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
)

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
)

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY

DO $$ BEGIN
  CREATE POLICY "read_only_auth" ON public.pipelines FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$

DO $$ BEGIN
  CREATE POLICY "service_full" ON public.pipelines FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$

DO $$ BEGIN
  CREATE POLICY "read_only_auth" ON public.pipeline_stages FOR SELECT USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$

DO $$ BEGIN
  CREATE POLICY "service_full" ON public.pipeline_stages FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$

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
  ADD COLUMN IF NOT EXISTS reason TEXT

-- ============ PROTETOR: drop views que dependem de deleted_at ============
DROP VIEW IF EXISTS public.vw_suppliers CASCADE

DROP VIEW IF EXISTS public.vw_suppliers_completo CASCADE

DROP VIEW IF EXISTS public.vw_fornecedores CASCADE

DROP VIEW IF EXISTS public.vw_suppliers_carriers CASCADE

COMMIT
