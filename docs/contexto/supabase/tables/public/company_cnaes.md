# public.company_cnaes

> Vínculo empresa ↔ CNAEs. Cada empresa tem 1 principal (is_principal=true) e N secundários.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `company_id` | `uuid` | não |  |  |  |
| 3 | `cnae_codigo` | `character varying(7)` | não |  |  |  |
| 4 | `is_principal` | `boolean` | sim | `false` |  |  |
| 5 | `origem` | `character varying(50)` | sim | `'manual'::character varying` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_cnaes_cnae_codigo_fkey | FOREIGN KEY | `FOREIGN KEY (cnae_codigo) REFERENCES cnaes(codigo)` | NO ACTION | NO ACTION | sim |
| company_cnaes_company_id_cnae_codigo_key | UNIQUE | `UNIQUE (company_id, cnae_codigo)` |  |  | sim |
| company_cnaes_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_cnaes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_cnaes_company_id_cnae_codigo_key | btree | company_id, cnae_codigo | sim | sim |  | `CREATE UNIQUE INDEX company_cnaes_company_id_cnae_codigo_key ON public.company_cnaes USING btree (company_id, cnae_codigo)` |
| company_cnaes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_cnaes_pkey ON public.company_cnaes USING btree (id)` |
| idx_company_cnaes_cnae | btree | cnae_codigo | não | sim |  | `CREATE INDEX idx_company_cnaes_cnae ON public.company_cnaes USING btree (cnae_codigo)` |
| idx_company_cnaes_company | btree | company_id | não | sim |  | `CREATE INDEX idx_company_cnaes_company ON public.company_cnaes USING btree (company_id)` |


## Policies (RLS)

### `company_cnaes_owner_or_admin_mfa_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_cnaes.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_cnaes.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |

### `company_cnaes_select_admin`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| tr_company_cnaes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
