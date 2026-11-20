-- Replace open SELECT policy with owner-scoped policy on entity_relationships
DROP POLICY IF EXISTS "auth users read entity_relationships" ON public.entity_relationships;

DROP POLICY IF EXISTS "owners read entity_relationships" ON public.entity_relationships;  -- [singu-idem]
CREATE POLICY "owners read entity_relationships"
  ON public.entity_relationships FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());