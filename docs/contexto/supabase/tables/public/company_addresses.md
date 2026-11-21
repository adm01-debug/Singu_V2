# public.company_addresses

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `tipo` | `text` | sim | `'''Comercial\|Faturamento''::character varying'::character varying` |  |  |
| 4 | `is_primary` | `boolean` | sim | `false` |  |  |
| 5 | `cep` | `character varying(10)` | sim |  |  |  |
| 6 | `logradouro` | `character varying(255)` | sim |  |  |  |
| 7 | `numero` | `character varying(20)` | sim |  |  |  |
| 8 | `complemento` | `text` | sim |  |  |  |
| 9 | `bairro` | `text` | sim |  |  |  |
| 10 | `cidade` | `text` | sim |  |  |  |
| 11 | `estado` | `character varying(2)` | sim |  |  |  |
| 12 | `pais` | `character varying(50)` | sim | `'Brasil'::character varying` |  |  |
| 13 | `latitude` | `numeric(10,8)` | sim |  |  | Latitude obtida via Google Places API ou geocoding |
| 14 | `longitude` | `numeric(11,8)` | sim |  |  | Longitude obtida via Google Places API ou geocoding |
| 15 | `ponto_referencia` | `character varying(255)` | sim |  |  |  |
| 16 | `instrucoes_entrega` | `text` | sim |  |  |  |
| 17 | `horario_funcionamento` | `text` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 20 | `google_maps_url` | `text` | sim |  |  | URL do Google Maps para este endereço |
| 21 | `google_place_id` | `text` | sim |  |  | Google Place ID para integração com Places API |
| 22 | `origem` | `character varying(50)` | sim |  |  | Origem: legacy_flat_migration, bitrix24_api, manual, viacep |
| 23 | `cidade_ibge` | `integer` | sim |  |  | FK para catálogo de cidades IBGE. Permite consultas geográficas por mesorregião, microrregião e coordenadas. |
| 24 | `tipo_logradouro` | `character varying(50)` | sim |  |  | Tipo do logradouro padrão Correios (Rua, Avenida, Travessa, Praça, etc.). Separado do nome do logradouro. |


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
