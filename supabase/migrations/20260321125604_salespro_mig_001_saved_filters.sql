-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125604
-- nome:   salespro_mig_001_saved_filters

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_filter_name_per_user_entity UNIQUE (user_id, entity_type, name)
);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_entity_type ON public.saved_filters(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_entity ON public.saved_filters(user_id, entity_type);
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view own filters" ON public.saved_filters FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert own filters" ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own filters" ON public.saved_filters FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own filters" ON public.saved_filters FOR DELETE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.entity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL, version_number INT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb, changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), change_summary TEXT,
  CONSTRAINT unique_entity_version UNIQUE (entity_type, entity_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_versions_entity ON public.entity_versions(entity_type, entity_id);
ALTER TABLE public.entity_versions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view versions" ON public.entity_versions FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
