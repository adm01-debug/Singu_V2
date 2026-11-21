# public.forms

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.forms_public |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `slug` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `fields` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `routing_rules` | `jsonb` | não | `'{"type": "round_robin", "members": []}'::jsonb` |  |  |
| 8 | `nurturing_workflow_id` | `uuid` | sim |  |  |  |
| 9 | `redirect_url` | `text` | sim |  |  |  |
| 10 | `success_message` | `text` | sim | `'Obrigado! Recebemos seus dados.'::text` |  |  |
| 11 | `is_published` | `boolean` | não | `false` |  |  |
| 12 | `view_count` | `integer` | não | `0` |  |  |
| 13 | `submission_count` | `integer` | não | `0` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| forms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| forms_slug_key | UNIQUE | `UNIQUE (slug)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lead_magnets | lead_magnets_form_id_fkey | form_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| forms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX forms_pkey ON public.forms USING btree (id)` |
| forms_slug_key | btree | slug | sim | sim |  | `CREATE UNIQUE INDEX forms_slug_key ON public.forms USING btree (slug)` |
| idx_forms_slug | btree | slug | não | sim |  | `CREATE INDEX idx_forms_slug ON public.forms USING btree (slug)` |
| idx_forms_user | btree | user_id | não | sim |  | `CREATE INDEX idx_forms_user ON public.forms USING btree (user_id)` |


## Policies (RLS)

### `Anon can view published forms`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | anon, authenticated |
| USING | `(is_published = true)` |
| WITH CHECK |  |

### `forms_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `forms_public_read_published`

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
| trg_forms_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |


Grants por coluna:

| coluna | role | privilégios |
|---|---|---|
| description | anon | SELECT |
| fields | anon | SELECT |
| id | anon | SELECT |
| is_published | anon | SELECT |
| name | anon | SELECT |
| redirect_url | anon | SELECT |
| slug | anon | SELECT |
| success_message | anon | SELECT |
