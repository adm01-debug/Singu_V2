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

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id)

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id)

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

CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies

CREATE POLICY "Users can insert their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies

CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id)

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

CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts

CREATE POLICY "Users can insert their own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts

CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = user_id)

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

CREATE POLICY "Users can view their own interactions"
  ON public.interactions FOR SELECT
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions

CREATE POLICY "Users can insert their own interactions"
  ON public.interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions

CREATE POLICY "Users can update their own interactions"
  ON public.interactions FOR UPDATE
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions

CREATE POLICY "Users can delete their own interactions"
  ON public.interactions FOR DELETE
  USING (auth.uid() = user_id)

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

CREATE POLICY "Users can view their own insights"
  ON public.insights FOR SELECT
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert their own insights" ON public.insights

CREATE POLICY "Users can insert their own insights"
  ON public.insights FOR INSERT
  WITH CHECK (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own insights" ON public.insights

CREATE POLICY "Users can update their own insights"
  ON public.insights FOR UPDATE
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own insights" ON public.insights

CREATE POLICY "Users can delete their own insights"
  ON public.insights FOR DELETE
  USING (auth.uid() = user_id)

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

CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert their own alerts" ON public.alerts

CREATE POLICY "Users can insert their own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.alerts

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts FOR DELETE
  USING (auth.uid() = user_id)

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

CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id)

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities

CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id)

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
