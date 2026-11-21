# public.search_products_cache

> SINGU: Cache de buscas de produtos por fornecedor (XBZ/Stricker/SPOT). TTL 6h. query_hash para dedup.

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
| 3 | `query_hash` | `text` | não |  |  |  |
| 4 | `query_text` | `text` | sim |  |  |  |
| 5 | `source` | `text` | não |  |  |  |
| 6 | `results` | `jsonb` | não |  |  |  |
| 7 | `result_count` | `integer` | sim |  |  |  |
| 8 | `cache_hit_count` | `integer` | sim | `0` |  |  |
| 9 | `last_accessed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `expires_at` | `timestamp with time zone` | não | `(now() + '06:00:00'::interval)` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `external_id` | `text` | sim |  |  |  |
| 13 | `name` | `text` | sim |  |  |  |
| 14 | `description` | `text` | sim |  |  |  |
| 15 | `category` | `text` | sim |  |  |  |
| 16 | `tags` | `text[]` | sim |  |  |  |
| 17 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 18 | `image_url` | `text` | sim |  |  |  |
| 19 | `price` | `numeric` | sim |  |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| search_products_cache_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| search_products_cache_source_check | CHECK | `CHECK (source = ANY (ARRAY['xbz'::text, 'stricker'::text, 'spot'::text, 'multi'::text, 'other'::text]))` |  |  | sim |
| unique_query_cache | UNIQUE | `UNIQUE (query_hash, source)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_search_products_cache_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_search_products_cache_user_id ON public.search_products_cache USING btree (user_id)` |
| idx_search_products_name_trgm | gin | name | não | sim |  | `CREATE INDEX idx_search_products_name_trgm ON public.search_products_cache USING gin (name gin_trgm_ops)` |
| idx_search_products_user | btree | user_id | não | sim |  | `CREATE INDEX idx_search_products_user ON public.search_products_cache USING btree (user_id)` |
| search_products_cache_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX search_products_cache_pkey ON public.search_products_cache USING btree (id)` |
| unique_query_cache | btree | query_hash, source | sim | sim |  | `CREATE UNIQUE INDEX unique_query_cache ON public.search_products_cache USING btree (query_hash, source)` |


## Policies (RLS)

### `Users delete own products cache`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own products cache`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own products cache`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own products cache`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `search_products_cache_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_update_search_products_cache_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
