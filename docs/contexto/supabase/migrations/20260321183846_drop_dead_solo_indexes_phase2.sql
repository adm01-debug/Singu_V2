-- ============================================================
-- FASE 2: ÍNDICES SOLO MORTOS — 0 scans, sem par útil
-- Critério: somente os claramente inúteis ou redundantes
-- ============================================================

-- companies (6.5MB liberados)
DROP INDEX IF EXISTS idx_companies_razao_social_upper;  -- UPPER() nunca usado, search_vector existe
DROP INDEX IF EXISTS idx_companies_cores_marca;          -- GIN em array cores_marca, feature nunca ativada

-- company_social_media (2MB liberados)
DROP INDEX IF EXISTS idx_company_social_handle;          -- handle sem company_id, UNIQUE já cobre

-- customers (3.6MB liberados) — boolean flags com seletividade ~0
DROP INDEX IF EXISTS idx_customers_comprou;              -- btree em boolean, inútil
DROP INDEX IF EXISTS idx_customers_ativado;              -- btree em boolean, inútil

-- company_emails (768KB liberados)
DROP INDEX IF EXISTS idx_company_emails_email;           -- email_normalizado solo, UNIQUE (company_id, LOWER) já cobre

-- contact_emails (336KB liberados)
DROP INDEX IF EXISTS idx_contact_emails_email;           -- email_normalizado solo, UNIQUE (contact_id, LOWER) já cobre
DROP INDEX IF EXISTS idx_contact_emails_email_lower;     -- LOWER(email) solo, sem contact_id, redundante com CI UNIQUE

-- contact_phones (112KB liberados)
DROP INDEX IF EXISTS idx_contact_phones_e164;            -- E.164 format lookup, 0 scans, normalizado serve

-- contact_social_media (32KB liberados)
DROP INDEX IF EXISTS idx_contact_social_plataforma;      -- plataforma solo, seletividade ~0 (6 valores)
