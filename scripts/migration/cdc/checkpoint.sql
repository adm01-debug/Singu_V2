-- Rodar no DESTINO antes do replay. Idempotente (pode rodar quantas vezes quiser).
CREATE TABLE IF NOT EXISTS public._migration_cdc_checkpoint (
  lsn text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public._migration_cdc_checkpoint ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  -- service_role só existe em projeto Supabase; em Postgres puro a tabela fica
  -- com RLS ligada e sem policy (só o dono acessa).
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON public._migration_cdc_checkpoint TO service_role;
    DROP POLICY IF EXISTS "cdc checkpoint service only" ON public._migration_cdc_checkpoint;
    CREATE POLICY "cdc checkpoint service only" ON public._migration_cdc_checkpoint
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
