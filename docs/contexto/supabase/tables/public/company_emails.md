# public.company_emails

> Endereços de e-mail associados a empresas, com finalidade, sinalização de principal/verificado e metadados de origem/contexto. Cada registro referencia public.companies.id.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_company_summary, public.v_entities, public.vw_alertas_pendentes_vendedor, public.vw_alertas_vendedor, public.vw_carrier_data_quality, public.vw_carrier_homologation_queue, public.vw_carriers, public.vw_carriers_completo, public.vw_carteira_sdr, public.vw_cliente_completo, public.vw_clientes_prioridade, public.vw_companies_completo, public.vw_companies_contato, public.vw_companies_duplicatas, public.vw_companies_stats, public.vw_contacts_full, public.vw_customers, public.vw_supplier_data_quality, public.vw_supplier_homologation_queue |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID do e-mail e chave primária; gerado por uuid_generate_v4(). |
| 2 | `company_id` | `uuid` | não |  |  | Empresa proprietária do e-mail; FK para public.companies.id. |
| 3 | `email_type` | `email_type` | sim | `'corporativo'::email_type` |  | Finalidade do e-mail: corporativo, pessoal, financeiro, nfe, marketing, comercial ou compras. DEFAULT corporativo. |
| 4 | `email` | `character varying(255)` | não |  |  | Endereço de e-mail da empresa; texto obrigatório. |
| 5 | `email_normalizado` | `character varying(255)` | sim |  |  | Versão normalizada do e-mail; algoritmo de normalização não declarado no schema. |
| 6 | `is_primary` | `boolean` | sim | `false` |  | Indica se este é o e-mail principal da empresa; DEFAULT false. |
| 7 | `departamento` | `character varying(50)` | sim |  |  | Departamento associado ao endereço; texto livre. |
| 8 | `observacao` | `character varying(100)` | sim |  |  | Observação livre sobre o e-mail. |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro; timestamptz, DEFAULT now(). |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |
| 11 | `fonte` | `character varying(100)` | sim |  |  | Origem textual do e-mail; domínio não restringido. |
| 12 | `contexto` | `character varying(200)` | sim |  |  | Contexto textual de uso do e-mail; domínio não restringido. |
| 13 | `confiabilidade` | `smallint` | sim |  |  | Score smallint de confiabilidade do e-mail; escala e interpretação não estão definidas no schema. |
| 14 | `is_verified` | `boolean` | sim | `false` |  | Indica se o e-mail foi verificado; DEFAULT false. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_emails_company_id_email_unique | UNIQUE | `UNIQUE (company_id, email)` |  |  | sim |
| company_emails_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_emails_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_emails_company_id_email_unique | btree | company_id, email | sim | sim |  | `CREATE UNIQUE INDEX company_emails_company_id_email_unique ON public.company_emails USING btree (company_id, email)` |
| company_emails_company_id_lower_email_unique | btree | company_id | sim | sim |  | `CREATE UNIQUE INDEX company_emails_company_id_lower_email_unique ON public.company_emails USING btree (company_id, lower((email)::text))` |
| company_emails_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_emails_pkey ON public.company_emails USING btree (id)` |
| idx_company_emails_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_company_emails_company_id ON public.company_emails USING btree (company_id)` |
| idx_company_emails_email_lower | btree |  | não | sim |  | `CREATE INDEX idx_company_emails_email_lower ON public.company_emails USING btree (lower((email)::text))` |


## Policies (RLS)

### `company_emails_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `company_emails_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `company_emails_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `company_emails_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `singu_company_relation_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |

### `singu_company_relation_scope`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_company_emails_normalizar | BEFORE | INSERT OR UPDATE | ROW | disabled | public.trg_normalizar_email |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
