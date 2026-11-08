-- Bloqueia cadastro de website, whatsapp e google_business em company_social_media.
-- Cada dado deve ficar no lugar canônico:
--   website     → companies.website
--   whatsapp    → company_phones (is_whatsapp = true)
--   google_business → company_addresses (google_place_id / google_maps_url)
ALTER TABLE company_social_media
ADD CONSTRAINT chk_social_media_platforms_only
CHECK (plataforma NOT IN ('website', 'whatsapp', 'google_business'));
