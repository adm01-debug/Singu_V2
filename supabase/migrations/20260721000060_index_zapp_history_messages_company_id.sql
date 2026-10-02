-- Migration: index_zapp_history_messages_company_id (Wave 146)
-- Adds missing index on zapp_history.messages(company_id).
-- Fixes advisor: unindexed_foreign_keys (zapp_history, 1 remaining).
--
-- messages is the core AI messaging table in the zapp_history schema.
-- company_id is a FK column used to scope messages per company in all
-- multi-tenant queries, dashboards, and AI pipeline filters. Without an
-- index, every company-scoped scan (the most common query pattern) requires
-- a full sequential scan of what can be a very large table.

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = to_regclass('zapp_history.messages')
      AND attname = 'company_id'
      AND NOT attisdropped
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_company_id
      ON zapp_history.messages (company_id);
  END IF;
END;
$migration$;
