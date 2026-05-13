-- 🏁 MIGRATION TEMPLATE
-- Description: [Brief description of the change]
-- Author: Lovable AI
-- Date: 2026-05-13

-- UP MIGRATION
BEGIN;

-- 1. Create/Modify table
-- CREATE TABLE IF NOT EXISTS public.example (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     ...
-- );

-- 2. Enable RLS
-- ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

-- 3. Add Policies
-- CREATE POLICY "Users can view their own data" ON public.example
-- FOR SELECT USING (auth.uid() = user_id);

-- 4. Audit triggers
-- SELECT audit.enable_tracking('public.example');

COMMIT;

-- DOWN MIGRATION (Rollback)
/*
BEGIN;
DROP TABLE IF EXISTS public.example;
COMMIT;
*/
