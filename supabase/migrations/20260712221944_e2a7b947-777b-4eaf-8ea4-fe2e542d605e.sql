
CREATE TABLE public.contact_analytical_profile_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.contact_analytical_profiles(id) ON DELETE SET NULL,
  summary TEXT,
  tone TEXT,
  communication_style TEXT,
  sentiment_trend TEXT,
  preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  hobbies JSONB NOT NULL DEFAULT '[]'::jsonb,
  recurrent_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  based_on_count INT NOT NULL DEFAULT 0,
  model TEXT,
  trigger_source TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capv_contact_generated ON public.contact_analytical_profile_versions (contact_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_capv_user ON public.contact_analytical_profile_versions (user_id);

GRANT SELECT ON public.contact_analytical_profile_versions TO authenticated;
GRANT ALL ON public.contact_analytical_profile_versions TO service_role;

ALTER TABLE public.contact_analytical_profile_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile versions"
ON public.contact_analytical_profile_versions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile versions"
ON public.contact_analytical_profile_versions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
