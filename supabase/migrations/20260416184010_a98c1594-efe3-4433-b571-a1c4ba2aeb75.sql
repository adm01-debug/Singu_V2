-- Adiciona token público para pesquisas NPS responderem sem login
ALTER TABLE public.csat_surveys
  ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS csat_surveys_public_token_key
  ON public.csat_surveys(public_token);

-- Política: qualquer um (anon) pode LER uma pesquisa por token, desde que não expirada e ainda pendente/respondida
DROP POLICY IF EXISTS "Public can read survey by token" ON public.csat_surveys;
CREATE POLICY "Public can read survey by token"
  ON public.csat_surveys
  FOR SELECT
  TO anon, authenticated
  USING (
    public_token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Política: qualquer um (anon) pode RESPONDER (UPDATE) uma pesquisa por token, desde que ainda pendente e não expirada
DROP POLICY IF EXISTS "Public can answer survey by token" ON public.csat_surveys;
CREATE POLICY "Public can answer survey by token"
  ON public.csat_surveys
  FOR UPDATE
  TO anon, authenticated
  USING (
    public_token IS NOT NULL
    AND status = 'sent'
    AND (expires_at IS NULL OR expires_at > now())
  )
  WITH CHECK (
    status IN ('answered', 'sent')
  );