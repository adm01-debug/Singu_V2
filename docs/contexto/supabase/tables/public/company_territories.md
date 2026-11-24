# public.company_territories

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
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `territory_id` | `uuid` | não |  |  |  |
| 4 | `assigned_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_territories_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_territories_company_id_key | UNIQUE | `UNIQUE (company_id)` |  |  | sim |
| company_territories_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| company_territories_territory_id_fkey | FOREIGN KEY | `FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_territories_company_id_key | btree | company_id | sim | sim |  | `CREATE UNIQUE INDEX company_territories_company_id_key ON public.company_territories USING btree (company_id)` |
| company_territories_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_territories_pkey ON public.company_territories USING btree (id)` |
| idx_company_territories_territory_id | btree | territory_id | não | sim |  | `CREATE INDEX idx_company_territories_territory_id ON public.company_territories USING btree (territory_id)` |


## Policies (RLS)

### `company_territories_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_territories.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
