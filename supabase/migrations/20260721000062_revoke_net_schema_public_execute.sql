-- Migration: revoke_net_schema_public_execute (Wave 148)
-- ATTEMPTED FIX — Platform-Limited (documents the security gap for tracking).
--
-- pg_net (net schema) functions expose net.http_get, net.http_post,
-- net.http_delete, and internal helpers to both anon and authenticated via
-- the default PUBLIC EXECUTE grant set by supabase_admin.
--
-- LIMITATION: All net schema functions are owned by supabase_admin (the
-- Supabase platform superuser). Migrations run as postgres, which is NOT a
-- superuser in managed Supabase environments and cannot revoke grants made by
-- supabase_admin. The REVOKE statements below execute without error but have
-- no actual effect — proacl remains {=X/supabase_admin, supabase_admin=X/...}.
--
-- RISK ASSESSMENT: Low-medium. The net schema is NOT in PostgREST's exposed
-- schemas (only public is), so anon/authenticated callers cannot invoke
-- net.http_post() directly via the REST API. Risk applies only to direct
-- database connections (pg pooler) or SECURITY INVOKER functions calling
-- into net. Fix requires Supabase support to restrict net schema access.
--
-- These REVOKE statements are left in the migration to document intent and
-- to take effect if Supabase grants postgres sufficient privileges in future.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM authenticated;
