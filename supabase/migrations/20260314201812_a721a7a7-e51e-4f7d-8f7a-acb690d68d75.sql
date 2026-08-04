-- Harden trigger_bundles policies against privilege escalation and anonymous access
ALTER POLICY "Users can create their own bundles"
ON public.trigger_bundles
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND (COALESCE(is_system_bundle, false) = false));

ALTER POLICY "Users can update their own bundles"
ON public.trigger_bundles
TO authenticated
USING ((auth.uid() = user_id) AND (is_system_bundle = false));

ALTER POLICY "Users can delete their own bundles"
ON public.trigger_bundles
TO authenticated
USING ((auth.uid() = user_id) AND (is_system_bundle = false));

ALTER POLICY "Users can view their own bundles"
ON public.trigger_bundles
TO authenticated
USING ((auth.uid() = user_id) OR (is_system_bundle = true));