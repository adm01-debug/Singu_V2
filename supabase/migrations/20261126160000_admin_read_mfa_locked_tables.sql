-- Leitura de admin sem MFA nas tabelas que hoje so liberam admin com `aal2`.
-- Nenhum usuario do sistema tem MFA, entao `*_owner_or_admin_mfa*` devolve zero linhas
-- para todo mundo: os relatorios que dependem dessas tabelas (vw_quem_ativou,
-- vw_quem_inativou, vw_company_social_media, vw_company_addresses, v_contact_summary)
-- aparecem vazios mesmo para o dono. As policies abaixo abrem SOMENTE leitura e SOMENTE
-- para o papel `admin`; escrita e leitura por dono continuam como estavam.
--
-- Guarda por `to_regclass`: parte destas tabelas nasceu fora das migrations (drift), entao
-- o banco de preview do PR nao as tem e o `CREATE POLICY` direto quebrava a previa.

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'company_cnaes',              -- CNPJ/CNAE das empresas (289.843 linhas)
    'company_social_media',       -- perfis sociais das empresas (99.245)
    'contact_addresses',          -- enderecos de contatos (17)
    'contact_emails',             -- e-mails de contatos (3.071)
    'contact_social_media',       -- perfis sociais de contatos (1.023)
    'customer_events',            -- eventos de ativacao/inativacao (45)
    'customer_ownership_history', -- historico de dono da carteira (12)
    'customer_sdr_history'        -- historico de SDR por cliente (5)
  ]
  LOOP
    IF to_regclass('public.' || tabela) IS NULL THEN
      RAISE NOTICE 'tabela % ausente neste banco, policy ignorada', tabela;
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tabela || '_select_admin', tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), ''admin''::public.app_role))',
      tabela || '_select_admin', tabela
    );
  END LOOP;
END
$$;