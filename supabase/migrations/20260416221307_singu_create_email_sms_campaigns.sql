-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221307
-- nome:   singu_create_email_sms_campaigns

-- ============================================================================
-- SINGU — CAMPANHAS EMAIL + SMS + LANDING PAGES (8 tabelas)
-- Specs: features/email-builder-visual, features/landing-pages-module
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  preheader text,
  from_name text,
  from_email text,
  reply_to text,
  html_body text,
  text_body text,
  builder_blocks jsonb DEFAULT '[]'::jsonb,
  template_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','cancelled','failed')),
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_delivered integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  total_complained integer DEFAULT 0,
  total_unsubscribed integer DEFAULT 0,
  open_rate numeric(5,2),
  click_rate numeric(5,2),
  segment_filter jsonb DEFAULT '{}'::jsonb,
  ab_test_config jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.email_campaigns IS 'SINGU: Campanhas de email marketing com Email Builder Visual (blocos), A/B test, agendamento e métricas full-funnel.';

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS subject text NOT NULL,
  ADD COLUMN IF NOT EXISTS preheader text,
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS from_email text,
  ADD COLUMN IF NOT EXISTS reply_to text,
  ADD COLUMN IF NOT EXISTS html_body text,
  ADD COLUMN IF NOT EXISTS text_body text,
  ADD COLUMN IF NOT EXISTS builder_blocks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','cancelled','failed')),
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS total_recipients integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_delivered integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_opened integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_clicked integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_bounced integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_complained integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_unsubscribed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS click_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS segment_filter jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ab_test_config jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed')),
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  bounced_at timestamp with time zone,
  bounce_reason text,
  opens_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  last_opened_at timestamp with time zone,
  last_clicked_url text,
  ab_variant text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.campaign_recipients IS 'SINGU: Destinatários individuais de email_campaigns com tracking granular (opens, clicks, bounces).';

ALTER TABLE public.campaign_recipients
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS campaign_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS email text NOT NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed')),
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS bounced_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS bounce_reason text,
  ADD COLUMN IF NOT EXISTS opens_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_clicked_url text,
  ADD COLUMN IF NOT EXISTS ab_variant text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  message text NOT NULL,
  sender_id text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','cancelled','failed')),
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_delivered integer DEFAULT 0,
  total_failed integer DEFAULT 0,
  total_opt_outs integer DEFAULT 0,
  cost numeric(10,4),
  provider text,
  segment_filter jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sms_campaigns IS 'SINGU: Campanhas de SMS com provider configurável, segmentação e tracking de custo.';

ALTER TABLE public.sms_campaigns
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS message text NOT NULL,
  ADD COLUMN IF NOT EXISTS sender_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','paused','cancelled','failed')),
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS total_recipients integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_delivered integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_failed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_opt_outs integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost numeric(10,4),
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS segment_filter jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.sms_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','opted_out')),
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  failure_reason text,
  provider_message_id text,
  cost numeric(10,4),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sms_campaign_recipients IS 'SINGU: Destinatários individuais de sms_campaigns.';

ALTER TABLE public.sms_campaign_recipients
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS campaign_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS phone_number text NOT NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','opted_out')),
  ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS failed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS cost numeric(10,4),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  message text NOT NULL,
  category text,
  variables jsonb DEFAULT '[]'::jsonb,
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.sms_templates IS 'SINGU: Templates reutilizáveis de SMS com placeholders de variáveis.';

ALTER TABLE public.sms_templates
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS name text NOT NULL,
  ADD COLUMN IF NOT EXISTS message text NOT NULL,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS variables jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.sms_opt_outs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  contact_id uuid,
  reason text,
  source text CHECK (source IN ('sms_reply','request','bounce','complaint','manual','gdpr')),
  opted_out_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_opt_out UNIQUE (user_id, phone_number)
);
COMMENT ON TABLE public.sms_opt_outs IS 'SINGU: Lista de telefones que fizeram opt-out de SMS (compliance LGPD). Check obrigatório antes de envio.';

ALTER TABLE public.sms_opt_outs
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_number text NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('sms_reply','request','bounce','complaint','manual','gdpr')),
  ADD COLUMN IF NOT EXISTS opted_out_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();


CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  html_content text,
  builder_blocks jsonb DEFAULT '[]'::jsonb,
  meta_title text,
  meta_description text,
  og_image text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  is_public boolean DEFAULT false,
  require_captcha boolean DEFAULT true,
  form_fields jsonb DEFAULT '[]'::jsonb,
  success_message text,
  redirect_url text,
  tracking_pixel_ids jsonb DEFAULT '[]'::jsonb,
  total_views integer DEFAULT 0,
  total_submissions integer DEFAULT 0,
  conversion_rate numeric(5,2),
  published_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_slug_lp UNIQUE (user_id, slug)
);
COMMENT ON TABLE public.landing_pages IS 'SINGU: Landing pages (rota pública /lp/:slug) com builder visual, captura de leads e UTMs. Mem: features/landing-pages-module.';

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS slug text NOT NULL,
  ADD COLUMN IF NOT EXISTS title text NOT NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS html_content text,
  ADD COLUMN IF NOT EXISTS builder_blocks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_captcha boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS form_fields jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS success_message text,
  ADD COLUMN IF NOT EXISTS redirect_url text,
  ADD COLUMN IF NOT EXISTS tracking_pixel_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_submissions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.landing_page_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL,
  user_id uuid NOT NULL,
  contact_id uuid,
  form_data jsonb NOT NULL,
  -- UTMs
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  -- Contexto
  ip_address inet,
  user_agent text,
  country text,
  region text,
  city text,
  device_type text,
  browser text,
  -- Processamento
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  processing_error text,
  spam_score integer CHECK (spam_score BETWEEN 0 AND 100),
  is_spam boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.landing_page_submissions IS 'SINGU: Submissões capturadas via landing pages com UTMs, geolocalização e anti-spam scoring.';

ALTER TABLE public.landing_page_submissions
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS landing_page_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS form_data jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS processing_error text,
  ADD COLUMN IF NOT EXISTS spam_score integer CHECK (spam_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS is_spam boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_status ON public.email_campaigns (user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON public.email_campaigns (scheduled_at) WHERE status='scheduled';
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON public.campaign_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact ON public.campaign_recipients (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_user_status ON public.sms_campaigns (user_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_campaign ON public.sms_campaign_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON public.sms_opt_outs (phone_number);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_status ON public.landing_pages (user_id, status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug_public ON public.landing_pages (slug) WHERE is_public=true AND status='published';
CREATE INDEX IF NOT EXISTS idx_lp_submissions_lp ON public.landing_page_submissions (landing_page_id, created_at DESC);

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['email_campaigns','campaign_recipients','sms_campaigns','sms_campaign_recipients',
                               'sms_templates','sms_opt_outs','landing_pages','landing_page_submissions'])
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
