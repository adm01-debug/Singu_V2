-- AÇÃO 14: Optimistic Locking (contacts + companies)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_version_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_increment_version ON public.contacts;
CREATE TRIGGER contacts_increment_version
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS companies_increment_version ON public.companies;
CREATE TRIGGER companies_increment_version
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version_column();

-- AÇÃO 16: Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated can read feature flags"
  ON public.feature_flags FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert feature flags" ON public.feature_flags;
CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete feature flags" ON public.feature_flags;
CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();