-- Migration: revoke_sequence_grants_anon (Wave 149)
-- All INSERT policies use WITH CHECK(auth.uid() = user_id) so anon can
-- never INSERT. anon has no legitimate need for sequence USAGE/SELECT/UPDATE.
-- Also revokes UPDATE (setval) from authenticated — admin operation only.

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE UPDATE ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
