ALTER TABLE public.contact_social_media
  ADD COLUMN IF NOT EXISTS fonte          TEXT,
  ADD COLUMN IF NOT EXISTS contexto       TEXT,
  ADD COLUMN IF NOT EXISTS confiabilidade SMALLINT DEFAULT 0;

UPDATE public.contact_social_media
SET fonte = origem
WHERE origem IS NOT NULL
  AND fonte IS NULL;
