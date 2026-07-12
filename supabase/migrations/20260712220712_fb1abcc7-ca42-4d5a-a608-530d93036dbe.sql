
ALTER TABLE public.contact_analytical_profiles
  ADD COLUMN IF NOT EXISTS hobbies jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS based_on_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='contact_analytical_profiles_contact_unique'
  ) THEN
    CREATE UNIQUE INDEX contact_analytical_profiles_contact_unique
      ON public.contact_analytical_profiles(contact_id);
  END IF;
END $$;
