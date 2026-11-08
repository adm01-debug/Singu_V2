# public.economic_groups

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `main_company_id` | `uuid` | sim |  |  |  |
| 5 | `total_revenue` | `numeric` | sim | `0` |  |  |
| 6 | `total_companies` | `integer` | sim | `0` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| economic_groups_main_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (main_company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| economic_groups_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.economic_group_members | economic_group_members_group_id_fkey | group_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| economic_groups_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX economic_groups_pkey ON public.economic_groups USING btree (id)` |
| idx_economic_groups_main_company_id_fk | btree | main_company_id | não | sim |  | `CREATE INDEX idx_economic_groups_main_company_id_fk ON public.economic_groups USING btree (main_company_id)` |


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

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_economic_groups_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
