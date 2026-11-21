# public.conversational_search_cache

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
| 3 | `query_hash` | `text` | não |  |  |  |
| 4 | `query_text` | `text` | não |  |  |  |
| 5 | `response` | `jsonb` | não |  |  |  |
| 6 | `model` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `expires_at` | `timestamp with time zone` | não | `(now() + '00:05:00'::interval)` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conversational_search_cache_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversational_search_cache_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conversational_search_cache_user_id_query_hash_key | UNIQUE | `UNIQUE (user_id, query_hash)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversational_search_cache_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversational_search_cache_pkey ON public.conversational_search_cache USING btree (id)` |
| conversational_search_cache_user_id_query_hash_key | btree | user_id, query_hash | sim | sim |  | `CREATE UNIQUE INDEX conversational_search_cache_user_id_query_hash_key ON public.conversational_search_cache USING btree (user_id, query_hash)` |
| idx_conv_search_cache_expires | btree | expires_at | não | sim |  | `CREATE INDEX idx_conv_search_cache_expires ON public.conversational_search_cache USING btree (expires_at)` |
| idx_conv_search_cache_user_hash | btree | user_id, query_hash | não | sim |  | `CREATE INDEX idx_conv_search_cache_user_hash ON public.conversational_search_cache USING btree (user_id, query_hash)` |


## Policies (RLS)

### `users delete own conv cache`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `users insert own conv cache`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `users read own conv cache`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `users update own conv cache`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
