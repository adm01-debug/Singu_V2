# public.territory_assignments

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `territory_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `assigned_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| territory_assignments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| territory_assignments_territory_id_fkey | FOREIGN KEY | `FOREIGN KEY (territory_id) REFERENCES territories(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| territory_assignments_territory_id_user_id_key | UNIQUE | `UNIQUE (territory_id, user_id)` |  |  | sim |
| territory_assignments_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_territory_assignments_territory_id | btree | territory_id | não | sim |  | `CREATE INDEX idx_territory_assignments_territory_id ON public.territory_assignments USING btree (territory_id)` |
| idx_territory_assignments_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_territory_assignments_user_id ON public.territory_assignments USING btree (user_id)` |
| territory_assignments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX territory_assignments_pkey ON public.territory_assignments USING btree (id)` |
| territory_assignments_territory_id_user_id_key | btree | territory_id, user_id | sim | sim |  | `CREATE UNIQUE INDEX territory_assignments_territory_id_user_id_key ON public.territory_assignments USING btree (territory_id, user_id)` |


## Policies (RLS)

### `territory_assignments_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `territory_assignments_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `territory_assignments_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `territory_assignments_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

_nenhum_
