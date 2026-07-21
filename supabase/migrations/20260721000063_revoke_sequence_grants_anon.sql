-- Migration: revoke_sequence_grants_anon (Wave 149)
-- Removes excess sequence privileges from anon and authenticated.
--
-- All 8 sequences in public schema have explicit anon=rwU (SELECT, UPDATE,
-- USAGE) grants. anon has no legitimate need for any of these because:
--   - Every INSERT policy in public has WITH CHECK (auth.uid() = user_id),
--     which evaluates to NULL = <uuid> = false for anon (uid is null)
--   - anon cannot INSERT into any table → does not need sequence USAGE
--   - anon should never call nextval() or setval() directly (counter pollution)
--
-- authenticated retains USAGE (needed for INSERT with serial/sequence defaults)
-- and SELECT (currval). UPDATE (setval) is revoked — resetting sequences is an
-- administrative operation that application code must never perform directly.
--
-- Affected sequences:
--   asia_upload_mapping_id_seq, config_regras_negocio_id_seq,
--   connector_log_id_seq, proposal_number_seq, quote_number_seq,
--   staging_portal_sicoob_id_seq, support_tickets_ticket_number_seq,
--   xbz_upload_mapping_id_seq

-- Revoke all sequence privileges from anon (can't use INSERT anyway)
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Revoke setval() ability from authenticated (administrative operation only)
REVOKE UPDATE ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
