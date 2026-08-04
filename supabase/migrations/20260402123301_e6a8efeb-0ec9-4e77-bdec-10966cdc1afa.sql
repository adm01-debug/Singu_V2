-- Realtime messages RLS - restrict channel subscriptions
-- Note: realtime.messages is managed by Supabase internally.
-- The proper way to secure Realtime is via RLS on the source tables (already done)
-- and by using private channels with authorization callbacks.
-- We cannot directly alter realtime schema tables as they are Supabase-reserved.

-- Instead, ensure all source tables have proper RLS (already verified).
-- No migration needed - this is an infrastructure-level configuration.
SELECT 1;
