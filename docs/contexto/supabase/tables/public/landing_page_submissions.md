# public.landing_page_submissions

> SINGU: Submissões capturadas via landing pages com UTMs, geolocalização e anti-spam scoring.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `landing_page_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `form_data` | `jsonb` | não |  |  |  |
| 6 | `utm_source` | `text` | sim |  |  |  |
| 7 | `utm_medium` | `text` | sim |  |  |  |
| 8 | `utm_campaign` | `text` | sim |  |  |  |
| 9 | `utm_term` | `text` | sim |  |  |  |
| 10 | `utm_content` | `text` | sim |  |  |  |
| 11 | `referrer` | `text` | sim |  |  |  |
| 12 | `ip_address` | `inet` | sim |  |  |  |
| 13 | `user_agent` | `text` | sim |  |  |  |
| 14 | `country` | `text` | sim |  |  |  |
| 15 | `region` | `text` | sim |  |  |  |
| 16 | `city` | `text` | sim |  |  |  |
| 17 | `device_type` | `text` | sim |  |  |  |
| 18 | `browser` | `text` | sim |  |  |  |
| 19 | `processed` | `boolean` | sim | `false` |  |  |
| 20 | `processed_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `processing_error` | `text` | sim |  |  |  |
| 22 | `spam_score` | `integer` | sim |  |  |  |
| 23 | `is_spam` | `boolean` | sim | `false` |  |  |
| 24 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 25 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 26 | `data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 27 | `email` | `text` | sim |  |  |  |
| 28 | `name` | `text` | sim |  |  |  |
| 29 | `phone` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| landing_page_submissions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| landing_page_submissions_spam_score_check | CHECK | `CHECK (spam_score >= 0 AND spam_score <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_landing_page_submissions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_landing_page_submissions_user_id ON public.landing_page_submissions USING btree (user_id)` |
| landing_page_submissions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX landing_page_submissions_pkey ON public.landing_page_submissions USING btree (id)` |


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

### `owners read submissions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `public can insert submissions to published pages`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | anon, authenticated |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM landing_pages lp   WHERE ((lp.id = landing_page_submissions.landing_page_id) AND (lp.is_published = true) AND (lp.user_id = landing_page_submissions.user_id))))` |


## Triggers

_nenhum_


## Grants

_nenhum_
