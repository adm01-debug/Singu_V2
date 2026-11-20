-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321183740
-- nome:   drop_duplicate_indexes_phase1

-- ============================================================
-- FASE 1: ÍNDICES DUPLICADOS — gêmeo com mais scans fica
-- Cada DROP tem comentário explicando o gêmeo que permanece
-- ============================================================

-- companies (6.4MB liberados)
DROP INDEX IF EXISTS idx_companies_grupo;           -- duplica idx_companies_grupo_economico (6.9K scans)
DROP INDEX IF EXISTS idx_companies_customer;         -- duplica idx_companies_is_customer (46 scans)
DROP INDEX IF EXISTS idx_companies_is_supplier;      -- duplica idx_companies_supplier (1 scan)

-- customers (5.5MB liberados)
DROP INDEX IF EXISTS idx_customers_company;          -- duplica idx_customers_company_id (46K scans)
DROP INDEX IF EXISTS idx_customers_vendedor_id;      -- duplica idx_customers_vendedor (3 scans)

-- company_rfm_scores (2.2MB liberados)
DROP INDEX IF EXISTS idx_company_rfm_company;        -- duplica idx_company_rfm_unique (7.8K scans)

-- company_phones (3.1MB liberados)
DROP INDEX IF EXISTS idx_company_phones_company;     -- duplica idx_company_phones_company_id (92K scans)
DROP INDEX IF EXISTS idx_company_phones_numero;      -- duplica idx_company_phones_normalizado (20 scans)

-- company_emails (576KB liberados)
DROP INDEX IF EXISTS idx_company_emails_company;     -- duplica idx_company_emails_company_id (46K scans)

-- contact_phones (224KB liberados)
DROP INDEX IF EXISTS idx_contact_phones_contact;     -- duplica idx_contact_phones_contact_id (3.4K scans)
DROP INDEX IF EXISTS idx_contact_phones_numero;      -- duplica idx_contact_phones_normalizado (5 scans)

-- contact_emails (112KB liberados)
DROP INDEX IF EXISTS idx_contact_emails_contact;     -- duplica idx_contact_emails_contact_id (3.3K scans)

-- contacts (264KB liberados)
DROP INDEX IF EXISTS idx_contacts_not_duplicate;     -- duplica idx_contacts_active (29 scans)
DROP INDEX IF EXISTS idx_contacts_company_id;        -- duplica idx_contacts_company (23K scans)

-- contact_social_media (80KB)
DROP INDEX IF EXISTS idx_contact_social_active;      -- duplica uq_contact_social_media (constraint, 15 scans)

-- Tabelas menores — índices regulares que duplicam constraints UNIQUE
DROP INDEX IF EXISTS idx_trigger_types_code;         -- duplica trigger_types_code_key (constraint)
DROP INDEX IF EXISTS idx_trigger_bundles_code;       -- duplica trigger_bundles_code_key (constraint)
DROP INDEX IF EXISTS idx_som_patterns_code;          -- duplica sleight_of_mouth_patterns_pattern_code_key (constraint)
DROP INDEX IF EXISTS idx_tags_nome;                  -- duplica tags_nome_key (constraint)
DROP INDEX IF EXISTS idx_wa_google_id;               -- duplica workspace_accounts_google_id_key (constraint)
DROP INDEX IF EXISTS idx_salespeople_auth_user;       -- duplica salespeople_auth_user_id_key (constraint)
DROP INDEX IF EXISTS idx_profiles_email;             -- duplica profiles_email_key (constraint)
