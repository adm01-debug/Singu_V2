-- Drop the old 7-parameter overload of create_deal that accepted a caller-supplied p_user_id.
-- Superseded by 20260720000003 which uses auth.uid() internally.
DROP FUNCTION IF EXISTS public.create_deal(
  uuid, text, numeric, text, date, uuid, uuid
);
