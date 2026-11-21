# public.lead_magnets

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `slug` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `type` | `text` | não | `'ebook'::text` |  |  |
| 7 | `file_path` | `text` | sim |  |  |  |
| 8 | `external_url` | `text` | sim |  |  |  |
| 9 | `thumbnail_url` | `text` | sim |  |  |  |
| 10 | `gated` | `boolean` | não | `true` |  |  |
| 11 | `form_id` | `uuid` | sim |  |  |  |
| 12 | `download_count` | `integer` | não | `0` |  |  |
| 13 | `view_count` | `integer` | não | `0` |  |  |
| 14 | `is_published` | `boolean` | não | `false` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_magnets_form_id_fkey | FOREIGN KEY | `FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lead_magnets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_magnets_slug_key | UNIQUE | `UNIQUE (slug)` |  |  | sim |
| lead_magnets_type_check | CHECK | `CHECK (type = ANY (ARRAY['ebook'::text, 'webinar'::text, 'whitepaper'::text, 'template'::text, 'video'::text, 'checklist'::text, 'other'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lead_magnet_downloads | lead_magnet_downloads_magnet_id_fkey | magnet_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lm_slug | btree | slug | não | sim |  | `CREATE INDEX idx_lm_slug ON public.lead_magnets USING btree (slug)` |
| idx_lm_user | btree | user_id | não | sim |  | `CREATE INDEX idx_lm_user ON public.lead_magnets USING btree (user_id)` |
| lead_magnets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_magnets_pkey ON public.lead_magnets USING btree (id)` |
| lead_magnets_slug_key | btree | slug | sim | sim |  | `CREATE UNIQUE INDEX lead_magnets_slug_key ON public.lead_magnets USING btree (slug)` |


## Policies (RLS)

### `lm_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `lm_public_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_published = true)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_lm_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |


Grants por coluna:

| coluna | role | privilégios |
|---|---|---|
| description | anon | SELECT |
| id | anon | SELECT |
| is_published | anon | SELECT |
| slug | anon | SELECT |
| thumbnail_url | anon | SELECT |
| title | anon | SELECT |
| type | anon | SELECT |
