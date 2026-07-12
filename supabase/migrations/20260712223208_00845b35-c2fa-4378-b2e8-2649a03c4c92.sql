
CREATE TABLE IF NOT EXISTS public.cron_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.cron_secrets TO service_role;
-- sem grants para authenticated/anon: só service_role acessa

ALTER TABLE public.cron_secrets ENABLE ROW LEVEL SECURITY;

-- policy vazia (nenhum role authenticated/anon pode ler)
CREATE POLICY "service role only"
  ON public.cron_secrets FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Semear a chave do cron se ainda não existir
INSERT INTO public.cron_secrets (name, value)
VALUES ('behavioral_rebatch', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;
