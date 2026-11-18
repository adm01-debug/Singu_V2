-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194844
-- nome:   drop_unused_indexes_public

-- A: _unaccent_trgm variants on companies (plain trgm kept)
DROP INDEX IF EXISTS public.idx_companies_name_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_companies_industry_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_companies_city_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_companies_nome_fantasia_trgm;

-- A: _unaccent_trgm variants on contacts
DROP INDEX IF EXISTS public.idx_contacts_email_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_contacts_first_name_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_contacts_last_name_unaccent_trgm;

-- B: Redundant contact search indexes
DROP INDEX IF EXISTS public.idx_contacts_full_name_trgm;
DROP INDEX IF EXISTS public.idx_contacts_search;
DROP INDEX IF EXISTS public.idx_contacts_first_name_lower;
DROP INDEX IF EXISTS public.idx_contacts_apelido_trgm;
DROP INDEX IF EXISTS public.idx_contacts_behavior;
DROP INDEX IF EXISTS public.idx_contacts_nome_tratamento;
DROP INDEX IF EXISTS public.idx_contacts_bitrix;

-- C: Unused audit_log indexes
DROP INDEX IF EXISTS public.idx_audit_log_record_id;
DROP INDEX IF EXISTS public.idx_audit_log_entity;
DROP INDEX IF EXISTS public.idx_audit_log_user;

-- C: Unused interactions indexes
DROP INDEX IF EXISTS public.idx_interactions_content_trgm;
DROP INDEX IF EXISTS public.idx_interactions_content_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_interactions_title_trgm;
DROP INDEX IF EXISTS public.idx_interactions_title_unaccent_trgm;
DROP INDEX IF EXISTS public.idx_interactions_emotion;
DROP INDEX IF EXISTS public.idx_interactions_usuario_responsavel_id;
DROP INDEX IF EXISTS public.idx_interactions_bitrix_activity_id;

-- C: Unused company sub-table indexes
DROP INDEX IF EXISTS public.idx_company_rfm_user_company;
DROP INDEX IF EXISTS public.idx_company_rfm_scores_segment_id;
DROP INDEX IF EXISTS public.idx_company_addresses_cidade_ibge;
DROP INDEX IF EXISTS public.idx_company_emails_created_at;

-- C: Other specialty unused indexes
DROP INDEX IF EXISTS public.idx_connector_log_cl_effective_payload;
DROP INDEX IF EXISTS public.idx_cl_effective_payload;
DROP INDEX IF EXISTS public.idx_cl_message_text_fts;
DROP INDEX IF EXISTS public.idx_cidades_nome_uf;
DROP INDEX IF EXISTS public.idx_cidades_nome;
DROP INDEX IF EXISTS public.idx_cidades_estado;
DROP INDEX IF EXISTS public.idx_contact_social_handle;
DROP INDEX IF EXISTS public.idx_grupo_bitrix;
DROP INDEX IF EXISTS public.idx_activity_feed_entity;
DROP INDEX IF EXISTS public.idx_carriers_homologado_score;
DROP INDEX IF EXISTS public.idx_sync_log_bitrix_id;
DROP INDEX IF EXISTS public.idx_kb_articles_search;
DROP INDEX IF EXISTS public.idx_sales_tasks_deleted_by;
DROP INDEX IF EXISTS public.idx_sales_tasks_due;
DROP INDEX IF EXISTS public.idx_supplier_homologations_avaliador;
DROP INDEX IF EXISTS public.idx_sales_tasks_status;
DROP INDEX IF EXISTS public.idx_sales_status;
DROP INDEX IF EXISTS public.idx_supplier_homologations_validade;
DROP INDEX IF EXISTS public.idx_ca_cidade;
DROP INDEX IF EXISTS public.idx_contact_addresses_updated_by;
DROP INDEX IF EXISTS public.idx_customers_created_at;
