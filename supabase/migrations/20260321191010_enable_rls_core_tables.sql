-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321191010
-- nome:   enable_rls_core_tables

-- ============================================================
-- P2: RLS nas tabelas core — seguindo padrão existente
-- service_role bypassa RLS automaticamente (MCPs, N8N)
-- Policies: authenticated + anon com acesso total (pode restringir depois)
-- ============================================================

-- 1. COMPANIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select ON public.companies FOR SELECT TO public USING (true);
CREATE POLICY companies_insert ON public.companies FOR INSERT TO public WITH CHECK (true);
CREATE POLICY companies_update ON public.companies FOR UPDATE TO public USING (true);
CREATE POLICY companies_delete ON public.companies FOR DELETE TO public USING (true);

-- 2. CONTACTS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_select ON public.contacts FOR SELECT TO public USING (true);
CREATE POLICY contacts_insert ON public.contacts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY contacts_update ON public.contacts FOR UPDATE TO public USING (true);
CREATE POLICY contacts_delete ON public.contacts FOR DELETE TO public USING (true);

-- 3. CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_select ON public.customers FOR SELECT TO public USING (true);
CREATE POLICY customers_insert ON public.customers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY customers_update ON public.customers FOR UPDATE TO public USING (true);
CREATE POLICY customers_delete ON public.customers FOR DELETE TO public USING (true);

-- 4. COMPANY_PHONES
ALTER TABLE public.company_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_phones_select ON public.company_phones FOR SELECT TO public USING (true);
CREATE POLICY company_phones_insert ON public.company_phones FOR INSERT TO public WITH CHECK (true);
CREATE POLICY company_phones_update ON public.company_phones FOR UPDATE TO public USING (true);
CREATE POLICY company_phones_delete ON public.company_phones FOR DELETE TO public USING (true);

-- 5. COMPANY_EMAILS
ALTER TABLE public.company_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_emails_select ON public.company_emails FOR SELECT TO public USING (true);
CREATE POLICY company_emails_insert ON public.company_emails FOR INSERT TO public WITH CHECK (true);
CREATE POLICY company_emails_update ON public.company_emails FOR UPDATE TO public USING (true);
CREATE POLICY company_emails_delete ON public.company_emails FOR DELETE TO public USING (true);

-- 6. COMPANY_ADDRESSES
ALTER TABLE public.company_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_addresses_select ON public.company_addresses FOR SELECT TO public USING (true);
CREATE POLICY company_addresses_insert ON public.company_addresses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY company_addresses_update ON public.company_addresses FOR UPDATE TO public USING (true);
CREATE POLICY company_addresses_delete ON public.company_addresses FOR DELETE TO public USING (true);

-- 7. COMPANY_SOCIAL_MEDIA
ALTER TABLE public.company_social_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_social_media_select ON public.company_social_media FOR SELECT TO public USING (true);
CREATE POLICY company_social_media_insert ON public.company_social_media FOR INSERT TO public WITH CHECK (true);
CREATE POLICY company_social_media_update ON public.company_social_media FOR UPDATE TO public USING (true);
CREATE POLICY company_social_media_delete ON public.company_social_media FOR DELETE TO public USING (true);

-- 8. CONTACT_PHONES
ALTER TABLE public.contact_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_phones_select ON public.contact_phones FOR SELECT TO public USING (true);
CREATE POLICY contact_phones_insert ON public.contact_phones FOR INSERT TO public WITH CHECK (true);
CREATE POLICY contact_phones_update ON public.contact_phones FOR UPDATE TO public USING (true);
CREATE POLICY contact_phones_delete ON public.contact_phones FOR DELETE TO public USING (true);

-- 9. CONTACT_EMAILS
ALTER TABLE public.contact_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_emails_select ON public.contact_emails FOR SELECT TO public USING (true);
CREATE POLICY contact_emails_insert ON public.contact_emails FOR INSERT TO public WITH CHECK (true);
CREATE POLICY contact_emails_update ON public.contact_emails FOR UPDATE TO public USING (true);
CREATE POLICY contact_emails_delete ON public.contact_emails FOR DELETE TO public USING (true);

-- 10. CONTACT_SOCIAL_MEDIA
ALTER TABLE public.contact_social_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_social_media_select ON public.contact_social_media FOR SELECT TO public USING (true);
CREATE POLICY contact_social_media_insert ON public.contact_social_media FOR INSERT TO public WITH CHECK (true);
CREATE POLICY contact_social_media_update ON public.contact_social_media FOR UPDATE TO public USING (true);
CREATE POLICY contact_social_media_delete ON public.contact_social_media FOR DELETE TO public USING (true);

-- 11. SUPPLIERS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY suppliers_select ON public.suppliers FOR SELECT TO public USING (true);
CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO public USING (true);
CREATE POLICY suppliers_delete ON public.suppliers FOR DELETE TO public USING (true);

-- 12. CARRIERS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY carriers_select ON public.carriers FOR SELECT TO public USING (true);
CREATE POLICY carriers_insert ON public.carriers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY carriers_update ON public.carriers FOR UPDATE TO public USING (true);
CREATE POLICY carriers_delete ON public.carriers FOR DELETE TO public USING (true);

-- 13. SYNC_LOG
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY sync_log_select ON public.sync_log FOR SELECT TO public USING (true);
CREATE POLICY sync_log_insert ON public.sync_log FOR INSERT TO public WITH CHECK (true);

-- 14. EMAIL_LOGS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_logs_select ON public.email_logs FOR SELECT TO public USING (true);
CREATE POLICY email_logs_insert ON public.email_logs FOR INSERT TO public WITH CHECK (true);

-- 15. GRUPOS_ECONOMICOS (referência)
ALTER TABLE public.grupos_economicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY grupos_economicos_all ON public.grupos_economicos FOR ALL TO public USING (true);

-- 16. COMPANY_CNAES
ALTER TABLE public.company_cnaes ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_cnaes_all ON public.company_cnaes FOR ALL TO public USING (true);

-- 17. CONTACT_ADDRESSES
ALTER TABLE public.contact_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_addresses_all ON public.contact_addresses FOR ALL TO public USING (true);
