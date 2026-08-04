CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  submission_count integer NOT NULL DEFAULT 0,
  redirect_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user ON public.landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages(slug) WHERE is_published = true;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage landing pages" ON public.landing_pages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public can read published landing pages" ON public.landing_pages FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE TRIGGER set_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.landing_page_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  email text,
  name text,
  phone text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lp_submissions_lp ON public.landing_page_submissions(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_lp_submissions_user ON public.landing_page_submissions(user_id);
ALTER TABLE public.landing_page_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners read submissions" ON public.landing_page_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "public can insert submissions to published pages" ON public.landing_page_submissions FOR INSERT TO anon, authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.landing_pages lp WHERE lp.id = landing_page_id AND lp.is_published = true AND lp.user_id = landing_page_submissions.user_id)
);