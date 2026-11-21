# public.user_badges

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
| 3 | `badge_id` | `uuid` | sim |  |  |  |
| 4 | `earned_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_badges_badge_id_fkey | FOREIGN KEY | `FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_badges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_badges_user_id_badge_id_key | UNIQUE | `UNIQUE (user_id, badge_id)` |  |  | sim |
| user_badges_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_badges_badge_id | btree | badge_id | não | sim |  | `CREATE INDEX idx_user_badges_badge_id ON public.user_badges USING btree (badge_id)` |
| idx_user_badges_user | btree | user_id | não | sim |  | `CREATE INDEX idx_user_badges_user ON public.user_badges USING btree (user_id)` |
| user_badges_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_badges_pkey ON public.user_badges USING btree (id)` |
| user_badges_user_id_badge_id_key | btree | user_id, badge_id | sim | sim |  | `CREATE UNIQUE INDEX user_badges_user_id_badge_id_key ON public.user_badges USING btree (user_id, badge_id)` |


## Policies (RLS)

### `user_badges_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `user_badges_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `user_badges_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `user_badges_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
