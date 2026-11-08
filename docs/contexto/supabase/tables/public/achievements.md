# public.achievements

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
| 2 | `salesperson_id` | `uuid` | não |  |  |  |
| 3 | `achievement_type` | `text` | não | `'daily_goal'::text` |  |  |
| 4 | `achievement_date` | `date` | não | `CURRENT_DATE` |  |  |
| 5 | `details` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| achievements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| achievements_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| achievements_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id)` |
| idx_achievements_salesperson_id | btree | salesperson_id | não | sim |  | `CREATE INDEX idx_achievements_salesperson_id ON public.achievements USING btree (salesperson_id)` |


## Policies (RLS)

### `achievements_all`

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
