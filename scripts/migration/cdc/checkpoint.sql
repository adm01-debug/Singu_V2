-- Rodar no DESTINO antes do replay.
CREATE TABLE IF NOT EXISTS public._migration_cdc_checkpoint (
  lsn text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public._migration_cdc_checkpoint TO service_role;
ALTER TABLE public._migration_cdc_checkpoint ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cdc checkpoint service only" ON public._migration_cdc_checkpoint
  FOR ALL TO service_role USING (true) WITH CHECK (true);