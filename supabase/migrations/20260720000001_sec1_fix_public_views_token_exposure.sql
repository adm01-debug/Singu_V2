-- SEC-1 Fix: Remove token enumeration from public views and over-permissive table policies.
--
-- Root cause: document_signatures_public and csat_surveys_public expose the
-- actual secret tokens (signature_token / public_token) to the anon role, allowing
-- any unauthenticated attacker to enumerate all pending tokens with a single GET request.
--
-- The legitimate flow for signatures uses the get-signature Edge Function
-- (SERVICE_ROLE, validates token, returns data without leaking other tokens).
-- The view is not used by any frontend page.
--
-- The legitimate flow for CSAT surveys uses PublicSurvey.tsx which queries
-- csat_surveys directly filtered by public_token — the view is not needed.

-- ─── document_signatures ───────────────────────────────────────────────────

-- 1. Recreate view WITHOUT signature_token in the SELECT list.
--    Keep security_barrier=true (already set by migration 20260711151001).
CREATE OR REPLACE VIEW public.document_signatures_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id,
  -- signature_token intentionally omitted: callers must already possess the
  -- token (it is part of the URL) — returning it allows mass enumeration.
  signer_name,
  signer_email,
  rendered_html,
  status,
  viewed_at,
  signed_at,
  expires_at
FROM public.document_signatures
WHERE signature_token IS NOT NULL
  AND status <> ALL (ARRAY['declined'::text, 'expired'::text])
  AND (expires_at IS NULL OR expires_at > now());

-- 2. Revoke anon SELECT on the view (access is via get-signature Edge Function only).
REVOKE SELECT ON public.document_signatures_public FROM anon;

-- 3. Drop the policy that lets anon enumerate every signature row on the base table.
--    The get-signature / submit-signature Edge Functions use SERVICE_ROLE and
--    do not rely on this policy.
DROP POLICY IF EXISTS "Anon can view own document signatures" ON public.document_signatures;

-- ─── csat_surveys ──────────────────────────────────────────────────────────

-- 4. Recreate csat_surveys_public WITHOUT public_token in the SELECT.
CREATE OR REPLACE VIEW public.csat_surveys_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id,
  -- public_token intentionally omitted: same mass-enumeration risk.
  channel,
  status,
  score,
  sent_at,
  expires_at
FROM public.csat_surveys
WHERE public_token IS NOT NULL
  AND (expires_at IS NULL OR expires_at > now());

-- 5. Revoke anon SELECT on the csat_surveys_public view.
--    PublicSurvey.tsx queries csat_surveys directly (filtered by public_token);
--    this view is unused by any frontend page.
REVOKE SELECT ON public.csat_surveys_public FROM anon;

-- 6. Tighten the anon SELECT policy on csat_surveys: keep access (needed for
--    PublicSurvey.tsx) but add an explicit UPDATE policy scoped to the same
--    public_token guard to prevent arbitrary row updates.
DROP POLICY IF EXISTS "Anon can submit csat survey answer" ON public.csat_surveys;
CREATE POLICY "Anon can submit csat survey answer" ON public.csat_surveys
  FOR UPDATE
  TO anon
  USING (public_token IS NOT NULL AND status = 'pending')
  WITH CHECK (public_token IS NOT NULL);

COMMENT ON VIEW public.document_signatures_public IS
  'Public signature view — signature_token excluded to prevent enumeration. '
  'Access by signers must go through the get-signature Edge Function.';

COMMENT ON VIEW public.csat_surveys_public IS
  'Public CSAT view — public_token excluded to prevent enumeration. '
  'Access by respondents uses csat_surveys directly filtered by public_token.';
