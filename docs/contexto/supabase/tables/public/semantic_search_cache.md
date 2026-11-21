# public.semantic_search_cache

> SINGU: Cache de buscas semânticas (embedding-based) com TTL 24h. query_embedding_hash para matching determinístico.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `query_text` | `text` | não |  |  |  |
| 4 | `query_embedding_hash` | `text` | não |  |  |  |
| 5 | `entity_type` | `text` | sim |  |  |  |
| 6 | `results` | `jsonb` | não |  |  |  |
| 7 | `similarity_threshold` | `numeric(4,3)` | sim | `0.75` |  |  |
| 8 | `result_count` | `integer` | sim |  |  |  |
| 9 | `cache_hit_count` | `integer` | sim | `0` |  |  |
| 10 | `last_accessed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `expires_at` | `timestamp with time zone` | não | `(now() + '24:00:00'::interval)` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `query_hash` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| semantic_search_cache_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['contact'::text, 'company'::text, 'product'::text, 'document'::text, 'article'::text, 'all'::text]))` |  |  | sim |
| semantic_search_cache_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| unique_semantic_cache | UNIQUE | `UNIQUE (query_embedding_hash, entity_type)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_semantic_cache_lookup | btree | user_id, query_hash, expires_at | não | sim |  | `CREATE INDEX idx_semantic_cache_lookup ON public.semantic_search_cache USING btree (user_id, query_hash, expires_at)` |
| semantic_search_cache_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX semantic_search_cache_pkey ON public.semantic_search_cache USING btree (id)` |
| semantic_search_cache_user_id_query_hash_key | btree | user_id, query_hash | sim | sim |  | `CREATE UNIQUE INDEX semantic_search_cache_user_id_query_hash_key ON public.semantic_search_cache USING btree (user_id, query_hash)` |
| unique_semantic_cache | btree | query_embedding_hash, entity_type | sim | sim |  | `CREATE UNIQUE INDEX unique_semantic_cache ON public.semantic_search_cache USING btree (query_embedding_hash, entity_type)` |


## Policies (RLS)

### `Users delete own search cache`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own search cache`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own search cache`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users view own search cache`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `semantic_search_cache_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
