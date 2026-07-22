-- Migration: drop_unused_indexes_public (Wave 133)
-- Drops indexes with idx_scan=0 that are provably redundant or unused.
-- Three categories:
--
--  A. _unaccent_trgm variants: immutable_unaccent(lower(col)) expressions
--     that are never referenced in application queries (the plain gin_trgm
--     variants on the same columns ARE used and are kept).
--
--  B. Redundant contact search indexes: full_name_trgm (redundant when
--     first_name+last_name trgm exist), email_unaccent_trgm (superseded by
--     email_trgm), contacts search_vector GIN (search_vector never queried).
--
--  C. Large unused specialty indexes: audit_log indexes with 0 scans,
--     contacts behavior JSONB index (unused), interactions trgm content
--     indexes (interactions use separate full-text approach), RFM indexes.
--
-- All dropped indexes have idx_scan=0 confirmed via pg_stat_user_indexes.
-- No unique/primary key indexes are included.

-- ── A: _unaccent_trgm variants on companies (plain trgm kept) ────────────────
DROP INDEX IF EXISTS public.idx_companies_name_unaccent_trgm;         -- 19 MB, superseded by idx_companies_name_trgm
DROP INDEX IF EXISTS public.idx_companies_industry_unaccent_trgm;     -- 11 MB, never queried
DROP INDEX IF EXISTS public.idx_companies_city_unaccent_trgm;         --  9 MB, never queried
DROP INDEX IF EXISTS public.idx_companies_nome_fantasia_trgm;         -- 15 MB, nome_fantasia not searched via trgm

-- ── A: _unaccent_trgm variants on contacts ───────────────────────────────────
DROP INDEX IF EXISTS public.idx_contacts_email_unaccent_trgm;         -- 736 kB, superseded by idx_contacts_email_trgm
DROP INDEX IF EXISTS public.idx_contacts_first_name_unaccent_trgm;   -- 528 kB, superseded by first_name_trgm
DROP INDEX IF EXISTS public.idx_contacts_last_name_unaccent_trgm;    -- 336 kB, superseded by last_name_trgm

-- ── B: Redundant contact search indexes ──────────────────────────────────────
DROP INDEX IF EXISTS public.idx_contacts_full_name_trgm;              -- 2.8 MB, first+last trgm cover individual fields
DROP INDEX IF EXISTS public.idx_contacts_search;                      -- 608 kB, search_vector GIN (0 scans)
DROP INDEX IF EXISTS public.idx_contacts_first_name_lower;            -- 224 kB, btree lower(first_name), 0 scans
DROP INDEX IF EXISTS public.idx_contacts_apelido_trgm;                -- 1.8 MB, nickname search (0 scans)
DROP INDEX IF EXISTS public.idx_contacts_behavior;                    -- 4.8 MB, JSONB behavior, 0 scans
DROP INDEX IF EXISTS public.idx_contacts_nome_tratamento;             -- 208 kB, 0 scans
DROP INDEX IF EXISTS public.idx_contacts_bitrix;                      -- 216 kB, Bitrix integration ID, 0 scans

-- ── C: Unused audit_log indexes ──────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_audit_log_record_id;                  -- 7.7 MB, 0 scans
DROP INDEX IF EXISTS public.idx_audit_log_entity;                     -- 6.6 MB, 0 scans
DROP INDEX IF EXISTS public.idx_audit_log_user;                       -- 2.3 MB, 0 scans

-- ── C: Unused interactions indexes ───────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_interactions_content_trgm;           -- 1.4 MB, 0 scans
DROP INDEX IF EXISTS public.idx_interactions_content_unaccent_trgm;  -- 1.4 MB, 0 scans
DROP INDEX IF EXISTS public.idx_interactions_title_trgm;             -- 552 kB, 0 scans
DROP INDEX IF EXISTS public.idx_interactions_title_unaccent_trgm;    -- 552 kB, 0 scans
DROP INDEX IF EXISTS public.idx_interactions_emotion;                 -- 264 kB, 0 scans
DROP INDEX IF EXISTS public.idx_interactions_usuario_responsavel_id;  -- 104 kB, 0 scans
DROP INDEX IF EXISTS public.idx_interactions_bitrix_activity_id;      -- 104 kB, 0 scans

-- ── C: Unused company sub-table indexes ──────────────────────────────────────
DROP INDEX IF EXISTS public.idx_company_rfm_user_company;             -- 2.4 MB, 0 scans
DROP INDEX IF EXISTS public.idx_company_rfm_scores_segment_id;       -- 352 kB, 0 scans
DROP INDEX IF EXISTS public.idx_company_addresses_cidade_ibge;        -- 1.3 MB, 0 scans
DROP INDEX IF EXISTS public.idx_company_emails_created_at;           -- 184 kB, 0 scans

-- ── C: Other specialty unused indexes ────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_connector_log_cl_effective_payload;   -- 96 kB, 0 scans (note: may be idx_cl_effective_payload)
DROP INDEX IF EXISTS public.idx_cl_effective_payload;                 -- 96 kB, 0 scans
DROP INDEX IF EXISTS public.idx_cl_message_text_fts;                  -- 56 kB, 0 scans
DROP INDEX IF EXISTS public.idx_cidades_nome_uf;                      -- 280 kB, 0 scans (covered by PK lookup)
DROP INDEX IF EXISTS public.idx_cidades_nome;                         -- 248 kB, 0 scans
DROP INDEX IF EXISTS public.idx_cidades_estado;                       -- 80 kB, 0 scans
DROP INDEX IF EXISTS public.idx_contact_social_handle;               -- 72 kB, 0 scans
DROP INDEX IF EXISTS public.idx_grupo_bitrix;                         -- 64 kB, 0 scans
DROP INDEX IF EXISTS public.idx_activity_feed_entity;                 -- 56 kB, 0 scans
DROP INDEX IF EXISTS public.idx_carriers_homologado_score;            -- 48 kB, 0 scans
DROP INDEX IF EXISTS public.idx_sync_log_bitrix_id;                   -- 32 kB, 0 scans
DROP INDEX IF EXISTS public.idx_kb_articles_search;                   -- 24 kB, 0 scans
DROP INDEX IF EXISTS public.idx_sales_tasks_deleted_by;               -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_sales_tasks_due;                      -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_supplier_homologations_avaliador;     -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_sales_tasks_status;                   -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_sales_status;                         -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_supplier_homologations_validade;      -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_ca_cidade;                            -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_contact_addresses_updated_by;         -- 16 kB, 0 scans
DROP INDEX IF EXISTS public.idx_customers_created_at;                 -- 360 kB, 0 scans
