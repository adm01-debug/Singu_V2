# public.form_submissions

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
| 2 | `form_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `routed_to` | `uuid` | sim |  |  |  |
| 7 | `utm_source` | `text` | sim |  |  |  |
| 8 | `utm_medium` | `text` | sim |  |  |  |
| 9 | `utm_campaign` | `text` | sim |  |  |  |
| 10 | `utm_content` | `text` | sim |  |  |  |
| 11 | `utm_term` | `text` | sim |  |  |  |
| 12 | `page_url` | `text` | sim |  |  |  |
| 13 | `user_agent` | `text` | sim |  |  |  |
| 14 | `ip_hash` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| form_submissions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| form_submissions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX form_submissions_pkey ON public.form_submissions USING btree (id)` |
| idx_fs_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_fs_contact ON public.form_submissions USING btree (contact_id)` |
| idx_fs_form | btree | form_id | não | sim |  | `CREATE INDEX idx_fs_form ON public.form_submissions USING btree (form_id)` |
| idx_fs_user | btree | user_id | não | sim |  | `CREATE INDEX idx_fs_user ON public.form_submissions USING btree (user_id)` |


## Policies (RLS)

### `fs_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `fs_public_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM forms f   WHERE ((f.id = form_submissions.form_id) AND (f.is_published = true) AND (f.user_id = form_submissions.user_id))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
