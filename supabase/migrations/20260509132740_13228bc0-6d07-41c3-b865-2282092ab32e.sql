-- Add external_id to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_contacts_external_id ON public.contacts(external_id);

-- Add external_id to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_companies_external_id ON public.companies(external_id);

-- Add external_id to interactions
ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_interactions_external_id ON public.interactions(external_id);