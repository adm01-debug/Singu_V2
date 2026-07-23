-- Rodada 40/10 — Onda G Bucket B (lote 6): DEFINER → INVOKER (view counters)

-- Privilégio column-level: anon só pode escrever em view_count
GRANT UPDATE (view_count) ON public.forms TO anon, authenticated;
GRANT UPDATE (view_count) ON public.lead_magnets TO anon, authenticated;

-- Política RLS estreita: UPDATE apenas em linhas publicadas, sem alterar owner
DROP POLICY IF EXISTS forms_public_increment_view ON public.forms;
CREATE POLICY forms_public_increment_view ON public.forms
  FOR UPDATE
  TO anon, authenticated
  USING (is_published = true)
  WITH CHECK (is_published = true);

DROP POLICY IF EXISTS lm_public_increment_view ON public.lead_magnets;
CREATE POLICY lm_public_increment_view ON public.lead_magnets
  FOR UPDATE
  TO anon, authenticated
  USING (is_published = true)
  WITH CHECK (is_published = true);

-- Converte funções para SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.increment_form_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.forms SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_magnet_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.lead_magnets SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$function$;