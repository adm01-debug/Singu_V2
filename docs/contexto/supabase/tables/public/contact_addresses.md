# public.contact_addresses

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `tipo` | `text` | não | `'profissional'::text` |  |  |
| 4 | `is_primary` | `boolean` | não | `false` |  |  |
| 5 | `cep` | `text` | sim |  |  |  |
| 6 | `logradouro` | `text` | sim |  |  |  |
| 7 | `numero` | `text` | sim |  |  |  |
| 8 | `complemento` | `text` | sim |  |  |  |
| 9 | `bairro` | `text` | sim |  |  |  |
| 10 | `cidade` | `text` | sim |  |  |  |
| 11 | `estado` | `character(2)` | sim |  |  |  |
| 12 | `pais` | `text` | sim | `'Brasil'::text` |  |  |
| 13 | `latitude` | `double precision` | sim |  |  |  |
| 14 | `longitude` | `double precision` | sim |  |  |  |
| 15 | `cidade_ibge` | `integer` | sim |  |  |  |
| 16 | `tipo_logradouro` | `text` | sim |  |  |  |
| 17 | `ponto_referencia` | `text` | sim |  |  |  |
| 18 | `google_maps_url` | `text` | sim |  |  |  |
| 19 | `google_place_id` | `text` | sim |  |  |  |
| 20 | `origem` | `text` | sim | `'manual'::text` |  |  |
| 21 | `fonte` | `text` | sim |  |  |  |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `created_by` | `integer` | sim |  |  |  |
| 25 | `updated_by` | `integer` | sim |  |  |  |


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
