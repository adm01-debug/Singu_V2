# public.company_phones

> Telefones de empresas com tipo, número normalizado, ramal, departamento e indicadores de principal/WhatsApp. Cada registro referencia public.companies.id.

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
| usada por views | public.v_company_summary, public.v_entities, public.vw_alertas_pendentes_vendedor, public.vw_alertas_vendedor, public.vw_carrier_data_quality, public.vw_carrier_homologation_queue, public.vw_carriers, public.vw_carriers_completo, public.vw_carteira_sdr, public.vw_cliente_completo, public.vw_clientes_prioridade, public.vw_companies_completo, public.vw_companies_contato, public.vw_companies_duplicatas, public.vw_companies_stats, public.vw_contacts_full, public.vw_customers, public.vw_customers_completo, public.vw_supplier_data_quality, public.vw_supplier_homologation_queue |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID do telefone e chave primária; gerado por uuid_generate_v4(). |
| 2 | `company_id` | `uuid` | não |  |  | Empresa proprietária do telefone; FK para public.companies.id. |
| 3 | `phone_type` | `phone_type` | sim | `'fixo_comercial'::phone_type` |  | Tipo do telefone: celular_corporativo, fixo_comercial, celular_pessoal ou invalido. DEFAULT fixo_comercial. |
| 4 | `numero` | `character varying(50)` | não |  |  | Número de telefone conforme informado; texto obrigatório para preservar máscara e conteúdo original. |
| 5 | `numero_normalizado` | `character varying(20)` | não |  |  | Representação normalizada do número; formato/algoritmo não é validado por CHECK. |
| 6 | `ramal` | `character varying(10)` | sim |  |  | Ramal telefônico em texto; opcional. |
| 7 | `is_primary` | `boolean` | sim | `false` |  | Indica se este é o telefone principal da empresa; DEFAULT false. |
| 8 | `is_whatsapp` | `boolean` | sim | `false` |  | Indica se o número é utilizável como WhatsApp; DEFAULT false. |
| 9 | `departamento` | `character varying(50)` | sim |  |  | Departamento associado ao telefone, em texto livre. |
| 10 | `observacao` | `character varying(100)` | sim |  |  | Observação livre sobre o telefone. |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro; timestamptz, DEFAULT now(). |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |
| 13 | `numero_e164` | `character varying(20)` | sim |  |  | Número em formato internacional E.164 quando disponível; sem validação de formato no schema. |
| 14 | `fonte` | `character varying(100)` | sim |  |  | Origem textual do número; valores não enumerados. |
| 15 | `contexto` | `character varying(200)` | sim |  |  | Contexto textual de uso do telefone; valores não enumerados. |
| 16 | `confiabilidade` | `smallint` | sim |  |  | Score smallint de confiabilidade do telefone; escala e interpretação não estão definidas no schema. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_phones_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_phones_company_id_numero_norm_unique | UNIQUE | `UNIQUE (company_id, numero_normalizado)` |  |  | sim |
| company_phones_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_phones_company_id_numero_norm_unique | btree | company_id, numero_normalizado | sim | sim |  | `CREATE UNIQUE INDEX company_phones_company_id_numero_norm_unique ON public.company_phones USING btree (company_id, numero_normalizado)` |
| company_phones_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_phones_pkey ON public.company_phones USING btree (id)` |
| idx_company_phones_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_company_phones_created_at ON public.company_phones USING btree (created_at)` |
| idx_company_phones_e164 | btree | numero_e164 | não | sim | `(numero_e164 IS NOT NULL)` | `CREATE INDEX idx_company_phones_e164 ON public.company_phones USING btree (numero_e164) WHERE (numero_e164 IS NOT NULL)` |
| idx_company_phones_normalizado | btree | numero_normalizado | não | sim |  | `CREATE INDEX idx_company_phones_normalizado ON public.company_phones USING btree (numero_normalizado)` |
| idx_company_phones_whatsapp | btree | company_id | não | sim | `(is_whatsapp = true)` | `CREATE INDEX idx_company_phones_whatsapp ON public.company_phones USING btree (company_id) WHERE (is_whatsapp = true)` |


## Policies (RLS)

### `company_phones_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `company_phones_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `company_phones_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `company_phones_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `singu_company_relation_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |

### `singu_company_relation_scope`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_company_phones_normalizar | BEFORE | INSERT OR UPDATE | ROW | enabled | public.trg_normalizar_telefone |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
