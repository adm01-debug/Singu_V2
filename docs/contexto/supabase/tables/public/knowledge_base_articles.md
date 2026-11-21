# public.knowledge_base_articles

> SINGU: Artigos da base de conhecimento público/interno. search_vector para busca full-text. Workflow draft→published→archived.

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `slug` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `content` | `text` | não |  |  |  |
| 6 | `excerpt` | `text` | sim |  |  |  |
| 7 | `category` | `text` | sim |  |  |  |
| 8 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `status` | `text` | não | `'draft'::text` |  |  |
| 10 | `visibility` | `text` | sim | `'public'::text` |  |  |
| 11 | `view_count` | `integer` | sim | `0` |  |  |
| 12 | `helpful_count` | `integer` | sim | `0` |  |  |
| 13 | `not_helpful_count` | `integer` | sim | `0` |  |  |
| 14 | `published_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 16 | `search_vector` | `tsvector` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `is_published` | `boolean` | sim | `true` |  |  |
| 20 | `views_count` | `integer` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| knowledge_base_articles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| knowledge_base_articles_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))` |  |  | sim |
| knowledge_base_articles_visibility_check | CHECK | `CHECK (visibility = ANY (ARRAY['public'::text, 'internal'::text, 'private'::text]))` |  |  | sim |
| unique_slug_per_user | UNIQUE | `UNIQUE (user_id, slug)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| knowledge_base_articles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX knowledge_base_articles_pkey ON public.knowledge_base_articles USING btree (id)` |
| unique_slug_per_user | btree | user_id, slug | sim | sim |  | `CREATE UNIQUE INDEX unique_slug_per_user ON public.knowledge_base_articles USING btree (user_id, slug)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users manage own kb articles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_knowledge_base_articles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
