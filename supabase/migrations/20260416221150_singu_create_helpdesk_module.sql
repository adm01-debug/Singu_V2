-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221150
-- nome:   singu_create_helpdesk_module

-- ============================================================================
-- SINGU — MÓDULO HELP DESK (3 tabelas)
-- Spec: memory features/help-desk-module.md
-- "Sistema completo de tickets de suporte com SLA automático"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_number bigserial,
  contact_id uuid,
  company_id uuid,
  subject text NOT NULL,
  description text,
  category text CHECK (category IN ('bug','question','request','complaint','feedback','billing','other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_customer','waiting_internal','resolved','closed','cancelled')),
  assigned_to uuid,
  channel text CHECK (channel IN ('email','whatsapp','phone','chat','form','portal','api')),
  -- SLA
  sla_first_response_deadline timestamp with time zone,
  sla_resolution_deadline timestamp with time zone,
  sla_first_response_breached boolean DEFAULT false,
  sla_resolution_breached boolean DEFAULT false,
  first_response_at timestamp with time zone,
  resolved_at timestamp with time zone,
  closed_at timestamp with time zone,
  -- CSAT
  csat_sent boolean DEFAULT false,
  csat_score integer CHECK (csat_score BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.support_tickets IS 'SINGU: Tickets de suporte com SLA automático por prioridade, canal multi (email/whatsapp/phone/chat), categorização e CSAT integrado. ticket_number sequential.';

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS ticket_number bigserial,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS subject text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('bug','question','request','complaint','feedback','billing','other')),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent','critical')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_customer','waiting_internal','resolved','closed','cancelled')),
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS channel text CHECK (channel IN ('email','whatsapp','phone','chat','form','portal','api')),
  ADD COLUMN IF NOT EXISTS sla_first_response_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS sla_resolution_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS sla_first_response_breached boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sla_resolution_breached boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_response_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS csat_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS csat_score integer CHECK (csat_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();


CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  author_type text NOT NULL DEFAULT 'agent' CHECK (author_type IN ('agent','customer','system','ai')),
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ticket_comments IS 'SINGU: Comentários/mensagens em tickets. is_internal=true = nota privada (não visível ao cliente).';

ALTER TABLE public.ticket_comments
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS ticket_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS author_type text NOT NULL DEFAULT 'agent' CHECK (author_type IN ('agent','customer','system','ai')),
  ADD COLUMN IF NOT EXISTS content text NOT NULL,
  ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.csat_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_id uuid,
  contact_id uuid,
  company_id uuid,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
  ces_score integer CHECK (ces_score BETWEEN 1 AND 7),
  feedback text,
  channel text,
  survey_type text DEFAULT 'csat' CHECK (survey_type IN ('csat','nps','ces','custom')),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.csat_surveys IS 'SINGU: Pesquisas de satisfação (CSAT 1-5, NPS 0-10, CES 1-7). Vinculadas opcionalmente a ticket/contact/company.';

ALTER TABLE public.csat_surveys
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS ticket_id uuid,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS ces_score integer CHECK (ces_score BETWEEN 1 AND 7),
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS survey_type text DEFAULT 'csat' CHECK (survey_type IN ('csat','nps','ces','custom')),
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shortcut text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] DEFAULT '{}'::text[],
  usage_count integer DEFAULT 0,
  is_shared boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_shortcut_per_user UNIQUE (user_id, shortcut)
);
COMMENT ON TABLE public.canned_responses IS 'SINGU: Respostas prontas/templates curtos acessíveis por shortcut (/ola, /encerrar, etc). is_shared=true para disponibilizar ao time.';

ALTER TABLE public.canned_responses
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS shortcut text NOT NULL,
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS content text NOT NULL,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text,
  tags text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public','internal','private')),
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  published_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_slug_per_user UNIQUE (user_id, slug)
);
COMMENT ON TABLE public.knowledge_base_articles IS 'SINGU: Artigos da base de conhecimento público/interno. search_vector para busca full-text. Workflow draft→published→archived.';

ALTER TABLE public.knowledge_base_articles
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS slug text NOT NULL,
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS content text NOT NULL,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public','internal','private')),
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status ON public.support_tickets (user_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets (assigned_to, status) WHERE status IN ('open','in_progress');
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON public.support_tickets (sla_resolution_deadline) WHERE status IN ('open','in_progress');
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON public.ticket_comments (ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_csat_surveys_ticket ON public.csat_surveys (ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_canned_responses_user ON public.canned_responses (user_id, shortcut);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON public.knowledge_base_articles (user_id, status) WHERE status='published';
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON public.knowledge_base_articles USING GIN (search_vector);

-- RLS em lote
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['support_tickets','ticket_comments','csat_surveys','canned_responses','knowledge_base_articles'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Users can view own" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can insert own" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can update own" ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "Users can delete own" ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id)', t);
    EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='updated_at') THEN
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END IF;
  END LOOP;
END $$;
