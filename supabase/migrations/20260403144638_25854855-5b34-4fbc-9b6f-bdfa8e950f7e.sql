
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lng double precision;

CREATE INDEX IF NOT EXISTS idx_companies_coords ON public.companies (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
