# public.economic_group_members

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
| 2 | `group_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `role` | `text` | sim | `'member'::text` |  |  |
| 5 | `joined_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| economic_group_members_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| economic_group_members_group_id_company_id_key | UNIQUE | `UNIQUE (group_id, company_id)` |  |  | sim |
| economic_group_members_group_id_fkey | FOREIGN KEY | `FOREIGN KEY (group_id) REFERENCES economic_groups(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| economic_group_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| economic_group_members_group_id_company_id_key | btree | group_id, company_id | sim | sim |  | `CREATE UNIQUE INDEX economic_group_members_group_id_company_id_key ON public.economic_group_members USING btree (group_id, company_id)` |
| economic_group_members_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX economic_group_members_pkey ON public.economic_group_members USING btree (id)` |
| idx_econ_group_members_company | btree | company_id | não | sim |  | `CREATE INDEX idx_econ_group_members_company ON public.economic_group_members USING btree (company_id)` |
| idx_economic_group_members_group_id | btree | group_id | não | sim |  | `CREATE INDEX idx_economic_group_members_group_id ON public.economic_group_members USING btree (group_id)` |


## Policies (RLS)

### `Authenticated read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
