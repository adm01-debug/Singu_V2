# public.documents

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
| 2 | `entity_type` | `text` | não |  |  |  |
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `file_name` | `text` | não |  |  |  |
| 5 | `file_url` | `text` | não |  |  |  |
| 6 | `file_type` | `text` | sim | `'document'::text` |  |  |
| 7 | `file_size` | `integer` | sim |  |  |  |
| 8 | `description` | `text` | sim |  |  |  |
| 9 | `user_id` | `uuid` | não |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `name` | `text` | sim |  |  |  |
| 12 | `document_type` | `text` | não | `'other'::text` |  |  |
| 13 | `mime_type` | `text` | sim |  |  |  |
| 14 | `version` | `integer` | sim | `1` |  |  |
| 15 | `status` | `text` | sim | `'active'::text` |  |  |
| 16 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_documents_status | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'archived'::text, 'draft'::text]))` |  |  | sim |
| documents_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| documents_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| documents_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id)` |
| idx_documents_entity | btree | entity_type, entity_id | não | sim |  | `CREATE INDEX idx_documents_entity ON public.documents USING btree (entity_type, entity_id)` |
| idx_documents_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_documents_user_id ON public.documents USING btree (user_id)` |


## Policies (RLS)

### `Users manage own documents`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `documents_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `documents_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `documents_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `documents_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_documents_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
