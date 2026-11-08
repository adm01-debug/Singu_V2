-- Migration: revoke_net_schema_public_execute (Wave 148)
-- CRITICAL SECURITY FIX: Revokes PUBLIC/anon/authenticated EXECUTE on all
-- net schema functions to close SSRF vector via pg_net.
-- service_role retains access; SECURITY DEFINER functions that call
-- net.http_* internally continue to work (run as function owner).

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM authenticated;
