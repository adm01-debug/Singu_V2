-- Drop the old 7-parameter overload of create_deal that accepted a caller-supplied p_user_id.
-- The new 6-parameter version (without p_user_id) is the canonical one and always uses auth.uid().
DROP FUNCTION IF EXISTS public.create_deal(
  uuid, text, numeric, text, date, uuid, uuid
);
