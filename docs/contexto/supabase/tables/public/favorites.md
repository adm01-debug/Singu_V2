# public.favorites

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| favorites_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| favorites_user_id_entity_type_entity_id_key | UNIQUE | `UNIQUE (user_id, entity_type, entity_id)` |  |  | sim |
| favorites_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| favorites_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX favorites_pkey ON public.favorites USING btree (id)` |
| favorites_user_id_entity_type_entity_id_key | btree | user_id, entity_type, entity_id | sim | sim |  | `CREATE UNIQUE INDEX favorites_user_id_entity_type_entity_id_key ON public.favorites USING btree (user_id, entity_type, entity_id)` |
| idx_favorites_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id)` |


## Policies (RLS)

### `favorites_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `favorites_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `favorites_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `favorites_update`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
