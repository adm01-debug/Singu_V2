-- Migration: index_zapp_history_messages_company_id (Wave 146)
-- Adds missing FK index on zapp_history.messages(company_id).
-- Fixes unindexed_foreign_keys advisor for zapp_history schema.

CREATE INDEX IF NOT EXISTS idx_messages_company_id
  ON zapp_history.messages (company_id);
