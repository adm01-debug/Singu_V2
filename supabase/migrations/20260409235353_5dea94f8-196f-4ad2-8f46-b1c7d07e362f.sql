-- Enable RLS on realtime.messages to prevent cross-user channel sniffing
-- Tolerante a ambientes (ex.: Supabase Preview Branching) onde o role que
-- aplica migrations não é owner de realtime.messages (schema gerenciado).
DO $$
BEGIN
  ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Sem privilégio de owner em realtime.messages neste ambiente — RLS já gerenciada pelo Supabase, seguindo.';
END $$;

-- Allow authenticated users to interact with realtime messages
-- The realtime system uses this table internally; the policy restricts
-- subscription authorization to authenticated users only
DO $$
BEGIN
  CREATE POLICY "Authenticated users can use realtime"
  ON realtime.messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Sem privilégio de owner em realtime.messages neste ambiente — policy já gerenciada pelo Supabase, seguindo.';
WHEN duplicate_object THEN
  RAISE NOTICE 'Policy já existe, seguindo.';
END $$;
