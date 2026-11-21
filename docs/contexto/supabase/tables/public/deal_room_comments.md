# public.deal_room_comments

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
| 2 | `room_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `author_side` | `text` | não |  |  |  |
| 5 | `author_label` | `text` | sim |  |  |  |
| 6 | `body` | `text` | não |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_room_comments_author_side_check | CHECK | `CHECK (author_side = ANY (ARRAY['seller'::text, 'buyer'::text]))` |  |  | sim |
| deal_room_comments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_room_comments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_room_comments_pkey ON public.deal_room_comments USING btree (id)` |
| idx_dr_comments_room | btree | room_id, created_at | não | sim |  | `CREATE INDEX idx_dr_comments_room ON public.deal_room_comments USING btree (room_id, created_at DESC)` |


## Policies (RLS)

### `owner_all_cmt`

| campo | valor |
|---|---|
| comando | ALL |
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
