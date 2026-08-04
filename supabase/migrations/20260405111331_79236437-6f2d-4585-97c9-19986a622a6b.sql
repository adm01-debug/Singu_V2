
-- Fix: Convert security definer view to security invoker
DROP VIEW IF EXISTS public.push_subscriptions_safe;

CREATE VIEW public.push_subscriptions_safe
WITH (security_invoker = true)
AS
SELECT id, user_id, endpoint, created_at
FROM public.push_subscriptions;
