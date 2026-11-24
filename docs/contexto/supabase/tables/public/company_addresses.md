# public.company_addresses

> Endereços associados a empresas do CRM. Cada registro pertence a uma empresa e pode incluir tipo, endereço postal, coordenadas geográficas e referências de geocodificação. company_id referencia public.companies.id; cidade_ibge referencia public.cidades.ibge_code. A coluna tipo tem um DEFAULT legado cujo conteúdo é ambíguo; não interpretá-lo como lista oficial de categorias sem validar os dados.

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
| usada por views | public.v_company_summary, public.vw_alertas_pendentes_vendedor, public.vw_carrier_by_state, public.vw_carrier_data_quality, public.vw_carrier_homologation_queue, public.vw_carriers, public.vw_carriers_completo, public.vw_cliente_completo, public.vw_clientes_prioridade, public.vw_companies_completo, public.vw_company_addresses, public.vw_contacts_sem_apelido, public.vw_customers, public.vw_supplier_by_state, public.vw_supplier_data_quality, public.vw_supplier_homologation_queue, public.vw_top_clientes_vendedor |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID do endereço e chave primária; gerado por uuid_generate_v4(). |
| 2 | `company_id` | `uuid` | não |  |  | Empresa proprietária do endereço; FK para public.companies.id. |
| 3 | `tipo` | `text` | sim | `'''Comercial\|Faturamento''::character varying'::character varying` |  | Categoria textual do endereço. DEFAULT legado aparece como Comercial\|Faturamento, mas a coluna não tem CHECK; não assumir se esse conteúdo é literal ou combinação de categorias. |
| 4 | `is_primary` | `boolean` | sim | `false` |  | Indica se este é o endereço principal da empresa; boolean nullable, DEFAULT false. |
| 5 | `cep` | `character varying(10)` | sim |  |  | CEP do endereço, armazenado como texto para preservar zeros e formatação. |
| 6 | `logradouro` | `character varying(255)` | sim |  |  | Nome textual do logradouro; o tipo do logradouro está separado em tipo_logradouro. |
| 7 | `numero` | `character varying(20)` | sim |  |  | Número predial ou identificador do endereço, como texto para preservar formatos não numéricos. |
| 8 | `complemento` | `text` | sim |  |  | Complemento do endereço em texto livre. |
| 9 | `bairro` | `text` | sim |  |  | Bairro do endereço em texto. |
| 10 | `cidade` | `text` | sim |  |  | Nome textual da cidade; cidade_ibge é o identificador normalizado quando disponível. |
| 11 | `estado` | `character varying(2)` | sim |  |  | Estado/UF em texto; o schema não impõe formato de duas letras. |
| 12 | `pais` | `character varying(50)` | sim | `'Brasil'::character varying` |  | País do endereço; DEFAULT Brasil. |
| 13 | `latitude` | `numeric(10,8)` | sim |  |  | Latitude geográfica numérica; comentário existente aponta origem Google Places/geocoding. Unidade esperada: graus decimais, sem CHECK de faixa no schema. |
| 14 | `longitude` | `numeric(11,8)` | sim |  |  | Longitude geográfica numérica; comentário existente aponta origem Google Places/geocoding. Unidade esperada: graus decimais, sem CHECK de faixa no schema. |
| 15 | `ponto_referencia` | `character varying(255)` | sim |  |  | Referência textual para localizar o endereço. |
| 16 | `instrucoes_entrega` | `text` | sim |  |  | Instruções de entrega associadas ao endereço, em texto livre. |
| 17 | `horario_funcionamento` | `text` | sim |  |  | Horário de funcionamento associado ao endereço, em texto livre; formato não padronizado no schema. |
| 18 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro de endereço; timestamptz, DEFAULT now(). |
| 19 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |
| 20 | `google_maps_url` | `text` | sim |  |  | URL do Google Maps associada ao endereço. |
| 21 | `google_place_id` | `text` | sim |  |  | Identificador de Place do Google usado na integração com Places API. |
| 22 | `origem` | `character varying(50)` | sim |  |  | Origem do dado conforme comentário existente: legacy_flat_migration, bitrix24_api, manual ou viacep. Não há CHECK constraint. |
| 23 | `cidade_ibge` | `integer` | sim |  |  | Código IBGE da cidade; FK para public.cidades.ibge_code. Permite relacionar com região, estado e coordenadas do catálogo. |
| 24 | `tipo_logradouro` | `character varying(50)` | sim |  |  | Tipo padronizado de logradouro, como Rua, Avenida, Travessa ou Praça; separado do nome em logradouro. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_addresses_cidade_ibge_fkey | FOREIGN KEY | `FOREIGN KEY (cidade_ibge) REFERENCES cidades(ibge_code)` | NO ACTION | NO ACTION | sim |
| company_addresses_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_addresses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_addresses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_addresses_pkey ON public.company_addresses USING btree (id)` |
| idx_company_addresses_cep | btree | cep | não | sim |  | `CREATE INDEX idx_company_addresses_cep ON public.company_addresses USING btree (cep)` |
| idx_company_addresses_cidade | btree | cidade, estado | não | sim |  | `CREATE INDEX idx_company_addresses_cidade ON public.company_addresses USING btree (cidade, estado)` |
| idx_company_addresses_cidade_ibge | btree | cidade_ibge | não | sim |  | `CREATE INDEX idx_company_addresses_cidade_ibge ON public.company_addresses USING btree (cidade_ibge)` |
| idx_company_addresses_company | btree | company_id | não | sim |  | `CREATE INDEX idx_company_addresses_company ON public.company_addresses USING btree (company_id)` |
| idx_company_addresses_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_company_addresses_created_at ON public.company_addresses USING btree (created_at)` |
| idx_company_addresses_primary | btree | company_id, is_primary | não | sim |  | `CREATE INDEX idx_company_addresses_primary ON public.company_addresses USING btree (company_id, is_primary)` |
| idx_company_addresses_tipo_logradouro | btree | tipo_logradouro | não | sim |  | `CREATE INDEX idx_company_addresses_tipo_logradouro ON public.company_addresses USING btree (tipo_logradouro)` |


## Policies (RLS)

### `company_addresses_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `company_addresses_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `company_addresses_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `company_addresses_update`

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
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |

### `singu_company_relation_scope`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| tr_company_addresses_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_singu_sync_company_address | AFTER | INSERT OR DELETE OR UPDATE | ROW | disabled | public.singu_sync_company_address |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
