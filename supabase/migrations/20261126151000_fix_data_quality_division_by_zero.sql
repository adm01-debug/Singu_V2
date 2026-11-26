-- Views de qualidade de cadastro de fornecedor/transportadora dividiam por count(*) e
-- estouravam division by zero quando a RLS do usuario devolvia zero linha (caso de
-- qualquer nao-admin, e de qualquer tela nova que consulte a view). NULLIF preserva o
-- resultado quando ha dado e devolve NULL em vez de erro quando nao ha.

CREATE OR REPLACE VIEW public.vw_supplier_data_quality WITH (security_invoker = true) AS
 SELECT count(*) AS total_fornecedores,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text) AS com_cnpj,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cnpj,
    count(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social <> ''::text) AS com_razao_social,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id))) AS com_telefone,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_telefone,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS com_email,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_email,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id))) AS com_endereco,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_endereco,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id))) AS com_contato,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_contato,
    count(*) FILTER (WHERE co.situacao_rf IS NOT NULL) AS com_situacao_rf,
    count(*) FILTER (WHERE NOT (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND NOT (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS sem_nenhum_contato,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id))) AS cadastro_completo,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses ca
          WHERE ca.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cadastro_completo
   FROM suppliers s
     JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL;;

CREATE OR REPLACE VIEW public.vw_carrier_data_quality WITH (security_invoker = true) AS
 SELECT count(*) AS total_transportadoras,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text) AS com_cnpj,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cnpj,
    count(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social <> ''::text) AS com_razao_social,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id))) AS com_telefone,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_telefone,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS com_email,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_email,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id))) AS com_endereco,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_endereco,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id))) AS com_contato,
    round(100.0 * count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM contacts ct
          WHERE ct.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_contato,
    count(*) FILTER (WHERE co.situacao_rf IS NOT NULL) AS com_situacao_rf,
    count(*) FILTER (WHERE NOT (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND NOT (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id))) AS sem_nenhum_contato,
    count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id))) AS cadastro_completo,
    round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> ''::text AND (EXISTS ( SELECT 1
           FROM company_phones cp
          WHERE cp.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_emails ce
          WHERE ce.company_id = co.id)) AND (EXISTS ( SELECT 1
           FROM company_addresses cad
          WHERE cad.company_id = co.id)))::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_cadastro_completo
   FROM carriers ca
     JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL;;
