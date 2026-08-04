-- Ação 7: Views públicas scoped para acesso anônimo seguro

-- 7.1 CSAT public view (apenas via public_token, não expirado)
CREATE OR REPLACE VIEW public.csat_surveys_public
WITH (security_invoker = on) AS
SELECT
  id,
  public_token,
  channel,
  status,
  score,
  sent_at,
  expires_at
FROM public.csat_surveys
WHERE public_token IS NOT NULL
  AND (expires_at IS NULL OR expires_at > now());

GRANT SELECT ON public.csat_surveys_public TO anon, authenticated;

-- 7.2 Forms public view (apenas formulários publicados)
CREATE OR REPLACE VIEW public.forms_public
WITH (security_invoker = on) AS
SELECT
  id,
  slug,
  name,
  description,
  fields,
  redirect_url,
  success_message
FROM public.forms
WHERE is_published = true;

GRANT SELECT ON public.forms_public TO anon, authenticated;

-- 7.3 Landing pages public view (apenas páginas publicadas)
CREATE OR REPLACE VIEW public.landing_pages_public
WITH (security_invoker = on) AS
SELECT
  id,
  slug,
  title,
  description,
  blocks,
  theme,
  redirect_url
FROM public.landing_pages
WHERE is_published = true;

GRANT SELECT ON public.landing_pages_public TO anon, authenticated;

-- 7.4 Document signatures public view (apenas via signature_token, não expirado/declinado)
CREATE OR REPLACE VIEW public.document_signatures_public
WITH (security_invoker = on) AS
SELECT
  id,
  signature_token,
  signer_name,
  signer_email,
  rendered_html,
  status,
  viewed_at,
  signed_at,
  expires_at
FROM public.document_signatures
WHERE signature_token IS NOT NULL
  AND status NOT IN ('declined', 'expired')
  AND (expires_at IS NULL OR expires_at > now());

GRANT SELECT ON public.document_signatures_public TO anon, authenticated;

COMMENT ON VIEW public.csat_surveys_public IS 'Acesso anônimo seguro a pesquisas CSAT via public_token. Exclui feedback e user_id.';
COMMENT ON VIEW public.forms_public IS 'Renderização anônima de formulários publicados via slug. Exclui user_id, view_count, submission_count.';
COMMENT ON VIEW public.landing_pages_public IS 'Renderização anônima de landing pages publicadas via slug. Exclui user_id e métricas internas.';
COMMENT ON VIEW public.document_signatures_public IS 'Assinatura anônima via signature_token. Exclui IP, user_agent, merge_data, template_id.';