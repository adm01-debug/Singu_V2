# public.territories

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
| 4 | `states` | `text[]` | sim |  |  |  |
| 5 | `cities` | `text[]` | sim |  |  |  |
| 6 | `manager_id` | `uuid` | sim |  |  |  |
| 7 | `is_active` | `boolean` | sim | `true` |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| territories_manager_id_fkey | FOREIGN KEY | `FOREIGN KEY (manager_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| territories_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.company_territories | company_territories_territory_id_fkey | territory_id | CASCADE |
| public.territory_assignments | territory_assignments_territory_id_fkey | territory_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_territories_manager_id | btree | manager_id | não | sim |  | `CREATE INDEX idx_territories_manager_id ON public.territories USING btree (manager_id)` |
| territories_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX territories_pkey ON public.territories USING btree (id)` |


## Policies (RLS)

### `territories_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

_nenhum_
