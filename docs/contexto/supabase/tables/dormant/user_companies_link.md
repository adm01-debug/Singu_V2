# _dormant.user_companies_link

> SINGU: Vínculo de permissão entre usuários e empresas compartilhadas

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | não |  |  |  |
| 4 | `permission` | `text` | sim | `'view'::text` |  |  |
| 5 | `shared_by` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_companies_link_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_companies_link_permission_check | CHECK | `CHECK (permission = ANY (ARRAY['view'::text, 'edit'::text, 'admin'::text]))` |  |  | sim |
| user_companies_link_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_companies_link_shared_by_fkey | FOREIGN KEY | `FOREIGN KEY (shared_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| user_companies_link_user_id_company_id_key | UNIQUE | `UNIQUE (user_id, company_id)` |  |  | sim |
| user_companies_link_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_companies_link_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_companies_link_pkey ON _dormant.user_companies_link USING btree (id)` |
| user_companies_link_user_id_company_id_key | btree | user_id, company_id | sim | sim |  | `CREATE UNIQUE INDEX user_companies_link_user_id_company_id_key ON _dormant.user_companies_link USING btree (user_id, company_id)` |


## Policies (RLS)

### `dormant_deny_all_user_companies_link`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
