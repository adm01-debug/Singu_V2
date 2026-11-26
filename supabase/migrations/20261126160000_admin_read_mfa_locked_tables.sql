-- Leitura de admin sem MFA nas tabelas que hoje so liberam admin com `aal2`.
-- Nenhum usuario do sistema tem MFA, entao `*_owner_or_admin_mfa*` devolve zero linhas
-- para todo mundo: os relatorios que dependem dessas tabelas (vw_quem_ativou,
-- vw_quem_inativou, vw_company_social_media, vw_company_addresses, v_contact_summary)
-- aparecem vazios mesmo para o dono. A policy abaixo abre SOMENTE leitura e SOMENTE
-- para o papel `admin`; escrita e leitura por dono continuam como estavam.

-- CNPJ/CNAE das empresas (289.843 linhas)
DROP POLICY IF EXISTS company_cnaes_select_admin ON public.company_cnaes;
CREATE POLICY company_cnaes_select_admin ON public.company_cnaes
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- perfis sociais das empresas (99.245)
DROP POLICY IF EXISTS company_social_media_select_admin ON public.company_social_media;
CREATE POLICY company_social_media_select_admin ON public.company_social_media
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- enderecos de contatos (17)
DROP POLICY IF EXISTS contact_addresses_select_admin ON public.contact_addresses;
CREATE POLICY contact_addresses_select_admin ON public.contact_addresses
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- e-mails de contatos (3.071)
DROP POLICY IF EXISTS contact_emails_select_admin ON public.contact_emails;
CREATE POLICY contact_emails_select_admin ON public.contact_emails
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- perfis sociais de contatos (1.023)
DROP POLICY IF EXISTS contact_social_media_select_admin ON public.contact_social_media;
CREATE POLICY contact_social_media_select_admin ON public.contact_social_media
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- eventos de cliente, ativacao/inativacao (45)
DROP POLICY IF EXISTS customer_events_select_admin ON public.customer_events;
CREATE POLICY customer_events_select_admin ON public.customer_events
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- historico de dono da carteira (12)
DROP POLICY IF EXISTS customer_ownership_history_select_admin ON public.customer_ownership_history;
CREATE POLICY customer_ownership_history_select_admin ON public.customer_ownership_history
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- historico de SDR por cliente (5)
DROP POLICY IF EXISTS customer_sdr_history_select_admin ON public.customer_sdr_history;
CREATE POLICY customer_sdr_history_select_admin ON public.customer_sdr_history
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
