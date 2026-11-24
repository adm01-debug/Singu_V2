# public.contact_addresses

> Endereços de pessoas/contatos. Cada registro pertence a public.contacts e possui categoria residencial, profissional, cobrança ou outro. Guarda dados postais e coordenadas opcionais. PK: id; contact_id → public.contacts.id; created_by e updated_by → public.users.id.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID do endereço e chave primária; gerado por gen_random_uuid(). |
| 2 | `contact_id` | `uuid` | não |  |  | Contato proprietário do endereço; FK para public.contacts.id. |
| 3 | `tipo` | `text` | não | `'profissional'::text` |  | Tipo do endereço: residencial, profissional, cobranca ou outro. DEFAULT profissional. |
| 4 | `is_primary` | `boolean` | não | `false` |  | Indica se o endereço é principal para o contato; DEFAULT false. |
| 5 | `cep` | `text` | sim |  |  | CEP em texto; preserva zeros e pontuação. |
| 6 | `logradouro` | `text` | sim |  |  | Nome do logradouro em texto; tipo_logradouro guarda separadamente Rua/Avenida etc. |
| 7 | `numero` | `text` | sim |  |  | Número ou identificador predial em texto. |
| 8 | `complemento` | `text` | sim |  |  | Complemento do endereço em texto livre. |
| 9 | `bairro` | `text` | sim |  |  | Bairro do endereço em texto livre. |
| 10 | `cidade` | `text` | sim |  |  | Nome textual da cidade; cidade_ibge fornece o vínculo ao catálogo IBGE quando preenchido. |
| 11 | `estado` | `character(2)` | sim |  |  | UF/estado em campo character; o schema não inclui CHECK de valores brasileiros. |
| 12 | `pais` | `text` | sim | `'Brasil'::text` |  | País do endereço; DEFAULT Brasil. |
| 13 | `latitude` | `double precision` | sim |  |  | Latitude em double precision, normalmente graus decimais; faixa não validada por CHECK. |
| 14 | `longitude` | `double precision` | sim |  |  | Longitude em double precision, normalmente graus decimais; faixa não validada por CHECK. |
| 15 | `cidade_ibge` | `integer` | sim |  |  | Código IBGE da cidade; FK declarada não aparece nesta tabela na inspeção, então validar constraint antes de assumir integridade referencial. |
| 16 | `tipo_logradouro` | `text` | sim |  |  | Tipo do logradouro, separado do nome do logradouro. |
| 17 | `ponto_referencia` | `text` | sim |  |  | Ponto de referência em texto livre para localização do endereço. |
| 18 | `google_maps_url` | `text` | sim |  |  | URL do Google Maps para este endereço, quando disponível. |
| 19 | `google_place_id` | `text` | sim |  |  | Identificador do local no Google Places, quando disponível. |
| 20 | `origem` | `text` | sim | `'manual'::text` |  | Origem do endereço; DEFAULT manual. Valores adicionais não são limitados por CHECK. |
| 21 | `fonte` | `text` | sim |  |  | Fonte textual complementar do endereço; sem domínio fechado no schema. |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  | Data e hora de criação do endereço; timestamptz, DEFAULT now(). |
| 23 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |
| 24 | `created_by` | `integer` | sim |  |  | ID integer do colaborador que criou o endereço; FK para public.users.id. |
| 25 | `updated_by` | `integer` | sim |  |  | ID integer do colaborador que atualizou o endereço; FK para public.users.id. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_addresses_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_addresses_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| contact_addresses_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_addresses_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['residencial'::text, 'profissional'::text, 'cobranca'::text, 'outro'::text]))` |  |  | sim |
| contact_addresses_updated_by_fkey | FOREIGN KEY | `FOREIGN KEY (updated_by) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_addresses_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_addresses_pkey ON public.contact_addresses USING btree (id)` |
| idx_ca_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_ca_contact ON public.contact_addresses USING btree (contact_id)` |
| idx_contact_addresses_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_contact_addresses_created_by ON public.contact_addresses USING btree (created_by)` |
| idx_contact_addresses_updated_by | btree | updated_by | não | sim |  | `CREATE INDEX idx_contact_addresses_updated_by ON public.contact_addresses USING btree (updated_by)` |


## Policies (RLS)

### `contact_addresses_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_addresses.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_addresses.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| serialize_contact_relation_write | BEFORE | INSERT OR DELETE OR UPDATE | ROW | enabled | public.guard_contact_relation_write |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_contact_addresses_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
