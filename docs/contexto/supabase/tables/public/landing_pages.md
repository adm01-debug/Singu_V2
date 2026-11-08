# public.landing_pages

> SINGU: Landing pages (rota pública /lp/:slug) com builder visual, captura de leads e UTMs. Mem: features/landing-pages-module.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 7 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.landing_pages_public |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `slug` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `html_content` | `text` | sim |  |  |  |
| 7 | `builder_blocks` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `meta_title` | `text` | sim |  |  |  |
| 9 | `meta_description` | `text` | sim |  |  |  |
| 10 | `og_image` | `text` | sim |  |  |  |
| 11 | `status` | `text` | não | `'draft'::text` |  |  |
| 12 | `is_public` | `boolean` | sim | `false` |  |  |
| 13 | `require_captcha` | `boolean` | sim | `true` |  |  |
| 14 | `form_fields` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 15 | `success_message` | `text` | sim |  |  |  |
| 16 | `redirect_url` | `text` | sim |  |  |  |
| 17 | `tracking_pixel_ids` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 18 | `total_views` | `integer` | sim | `0` |  |  |
| 19 | `total_submissions` | `integer` | sim | `0` |  |  |
| 20 | `conversion_rate` | `numeric(5,2)` | sim |  |  |  |
| 21 | `published_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `blocks` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 26 | `theme` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 27 | `is_published` | `boolean` | não | `false` |  |  |
| 28 | `view_count` | `integer` | não | `0` |  |  |
| 29 | `submission_count` | `integer` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| landing_pages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| landing_pages_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))` |  |  | sim |
| unique_slug_lp | UNIQUE | `UNIQUE (user_id, slug)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| landing_pages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX landing_pages_pkey ON public.landing_pages USING btree (id)` |
| landing_pages_slug_key | btree | slug | sim | sim |  | `CREATE UNIQUE INDEX landing_pages_slug_key ON public.landing_pages USING btree (slug)` |
| unique_slug_lp | btree | user_id, slug | sim | sim |  | `CREATE UNIQUE INDEX unique_slug_lp ON public.landing_pages USING btree (user_id, slug)` |


## Policies (RLS)

### `Anon can view published landing pages`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | anon, authenticated |
| USING | `(is_published = true)` |
| WITH CHECK |  |

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

### `owners manage landing pages`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `public can read published landing pages`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | anon, authenticated |
| USING | `(is_published = true)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_landing_pages_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| update_landing_pages_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
