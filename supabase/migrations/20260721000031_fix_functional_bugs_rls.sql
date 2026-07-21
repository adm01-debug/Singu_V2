-- Fix #1: error_logs — missing admin DELETE policy
-- clearLogsMutation was silently returning success with 0 rows deleted
CREATE POLICY "Admins can delete error_logs"
  ON public.error_logs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix #2: query_telemetry — admin purge was restricted to own rows by existing user policy
-- Add an additive admin policy so admins can purge all tenants' old telemetry
CREATE POLICY "Admins can delete any telemetry"
  ON public.query_telemetry FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix #3: social_sync_queue — missing INSERT + UPDATE policies caused 42501 errors
-- The entire social sync feature was non-functional (INSERT threw RLS violation)
CREATE POLICY "Users can insert own sync queue"
  ON public.social_sync_queue FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sync queue"
  ON public.social_sync_queue FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );

-- Fix #4: landing_pages view_count increment for anonymous visitors
-- Anon users have no UPDATE policy, so view_count never incremented.
-- SECURITY DEFINER RPC bypasses RLS safely (restricted to published pages only).
CREATE OR REPLACE FUNCTION public.increment_landing_page_view(page_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.landing_pages
  SET view_count = view_count + 1
  WHERE id = page_id
    AND is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_landing_page_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_landing_page_view(UUID) TO authenticated;
