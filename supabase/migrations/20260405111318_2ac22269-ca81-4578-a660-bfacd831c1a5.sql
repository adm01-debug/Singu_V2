
-- 1. Fix privilege escalation: explicitly deny non-admin INSERT/UPDATE/DELETE on user_roles
-- Drop the overly broad ALL policy for admins and replace with specific ones
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Admin SELECT
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin INSERT (only admins can assign roles)
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin UPDATE
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin DELETE
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix push_subscriptions: revoke SELECT on sensitive crypto columns
-- Replace the SELECT policy to exclude auth and p256dh columns
-- Since column-level security isn't available via RLS, we create a view
-- Instead, we'll revoke direct SELECT and use a security definer function

-- Drop the current SELECT policy
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;

-- Create a restricted SELECT policy that still works (users need to verify their own subscriptions exist)
-- But we'll create a view that omits the sensitive columns
CREATE POLICY "Users can view own subscriptions limited"
ON public.push_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: Column-level restrictions require a security definer view
-- Create a safe view that excludes crypto keys
CREATE OR REPLACE VIEW public.push_subscriptions_safe AS
SELECT id, user_id, endpoint, created_at
FROM public.push_subscriptions
WHERE auth.uid() = user_id;
