-- Restrict DISC methodology configuration to authenticated users only
DROP POLICY IF EXISTS "Everyone can view DISC profile configs" ON public.disc_profile_config

DROP POLICY IF EXISTS "Authenticated users can view DISC profile configs" ON public.disc_profile_config

-- [singu-idem]
CREATE POLICY "Authenticated users can view DISC profile configs"
ON public.disc_profile_config
FOR SELECT
TO authenticated
USING (true)
