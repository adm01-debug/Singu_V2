-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260410164154
-- nome:   add_mcp_public_access_policies

-- ═══════════════════════════════════════════════════
-- RLS: Acesso público para MCP (leitura + escrita)
-- Banco: CRM (pgxfvjmuubtbowutlide)
-- ═══════════════════════════════════════════════════

-- COMPANIES
CREATE POLICY "mcp_companies_read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "mcp_companies_write" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "mcp_companies_update" ON public.companies FOR UPDATE USING (true);

-- CONTACTS
CREATE POLICY "mcp_contacts_read" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "mcp_contacts_write" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "mcp_contacts_update" ON public.contacts FOR UPDATE USING (true);

-- INTERACTIONS
CREATE POLICY "mcp_interactions_read" ON public.interactions FOR SELECT USING (true);
CREATE POLICY "mcp_interactions_write" ON public.interactions FOR INSERT WITH CHECK (true);

-- CUSTOMERS
CREATE POLICY "mcp_customers_read" ON public.customers FOR SELECT USING (true);

-- INSIGHTS
CREATE POLICY "mcp_insights_read" ON public.insights FOR SELECT USING (true);

-- SALESPEOPLE
CREATE POLICY "mcp_salespeople_read" ON public.salespeople FOR SELECT USING (true);

-- PIPELINE_STAGES
CREATE POLICY "mcp_pipeline_stages_read" ON public.pipeline_stages FOR SELECT USING (true);

-- ACTIVITIES
CREATE POLICY "mcp_activities_read" ON public.activities FOR SELECT USING (true);

-- SALES_TASKS
CREATE POLICY "mcp_tasks_read" ON public.sales_tasks FOR SELECT USING (true);

-- LEAD_SOURCES
CREATE POLICY "mcp_lead_sources_read" ON public.lead_sources FOR SELECT USING (true);

-- COMPANY_ADDRESSES
CREATE POLICY "mcp_company_addr_read" ON public.company_addresses FOR SELECT USING (true);

-- COMPANY_PHONES
CREATE POLICY "mcp_company_phones_read" ON public.company_phones FOR SELECT USING (true);

-- COMPANY_EMAILS
CREATE POLICY "mcp_company_emails_read" ON public.company_emails FOR SELECT USING (true);

-- CONTACT_PHONES
CREATE POLICY "mcp_contact_phones_read" ON public.contact_phones FOR SELECT USING (true);

-- CONTACT_EMAILS
CREATE POLICY "mcp_contact_emails_read" ON public.contact_emails FOR SELECT USING (true);
