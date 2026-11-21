# public.deal_room_documents

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
| 4 | `title` | `text` | não |  |  |  |
| 5 | `file_path` | `text` | não |  |  |  |
| 6 | `file_type` | `text` | sim |  |  |  |
| 7 | `file_size` | `bigint` | sim |  |  |  |
| 8 | `uploaded_by_side` | `text` | não | `'seller'::text` |  |  |
| 9 | `view_count` | `integer` | não | `0` |  |  |
| 10 | `last_viewed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_room_documents_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_room_documents_uploaded_by_side_check | CHECK | `CHECK (uploaded_by_side = ANY (ARRAY['seller'::text, 'buyer'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_room_documents_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_room_documents_pkey ON public.deal_room_documents USING btree (id)` |
| idx_dr_docs_room | btree | room_id | não | sim |  | `CREATE INDEX idx_dr_docs_room ON public.deal_room_documents USING btree (room_id)` |
| idx_dr_docs_user | btree | user_id | não | sim |  | `CREATE INDEX idx_dr_docs_user ON public.deal_room_documents USING btree (user_id)` |


## Policies (RLS)

### `owner_all_docs`

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
