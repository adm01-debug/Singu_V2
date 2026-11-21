# public.document_views

> SINGU: Rastreamento granular de visualizações de documentos (páginas vistas, duração, downloads, geo).

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
| 2 | `document_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `viewer_email` | `text` | sim |  |  |  |
| 5 | `viewer_name` | `text` | sim |  |  |  |
| 6 | `ip_address` | `inet` | sim |  |  |  |
| 7 | `user_agent` | `text` | sim |  |  |  |
| 8 | `country` | `text` | sim |  |  |  |
| 9 | `city` | `text` | sim |  |  |  |
| 10 | `session_duration_seconds` | `integer` | sim |  |  |  |
| 11 | `pages_viewed` | `integer[]` | sim | `'{}'::integer[]` |  |  |
| 12 | `download_count` | `integer` | sim | `0` |  |  |
| 13 | `referer` | `text` | sim |  |  |  |
| 14 | `is_signer` | `boolean` | sim | `false` |  |  |
| 15 | `viewed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 17 | `signature_id` | `uuid` | sim |  |  |  |
| 18 | `viewer_ip` | `text` | sim |  |  |  |
| 19 | `viewer_user_agent` | `text` | sim |  |  |  |
| 20 | `duration_seconds` | `integer` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| document_views_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| document_views_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX document_views_pkey ON public.document_views USING btree (id)` |
| idx_document_views_signature | btree | signature_id | não | sim |  | `CREATE INDEX idx_document_views_signature ON public.document_views USING btree (signature_id)` |
| idx_document_views_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_document_views_user_id ON public.document_views USING btree (user_id)` |


## Policies (RLS)

### `Owner views document_views via signature`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM document_signatures s   WHERE ((s.id = document_views.signature_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))` |
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

### `service_role_inserts_document_views`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `false` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
