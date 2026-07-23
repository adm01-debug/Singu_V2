
-- Rodada 44/10 — Least Privilege para endpoints públicos.

-- forms: anon somente SELECT (renderização pública via slug)
REVOKE INSERT, UPDATE, DELETE ON public.forms FROM anon;

-- form_submissions: anon sem acesso (edge function form-submit-handler usa service_role)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.form_submissions FROM anon;

-- lead_magnets: anon somente SELECT (renderização pública)
REVOKE INSERT, UPDATE, DELETE ON public.lead_magnets FROM anon;

-- lead_magnet_downloads: anon sem acesso (registro via edge function/service_role)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.lead_magnet_downloads FROM anon;

-- landing_pages: anon somente SELECT (renderização pública)
REVOKE INSERT, UPDATE, DELETE ON public.landing_pages FROM anon;

-- landing_page_submissions: anon apenas INSERT (formulário público grava direto)
REVOKE SELECT, UPDATE, DELETE ON public.landing_page_submissions FROM anon;

-- deal_room_activities: anon sem acesso (telemetria via edge function/service_role)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.deal_room_activities FROM anon;
