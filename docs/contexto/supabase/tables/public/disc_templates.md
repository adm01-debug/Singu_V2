# public.disc_templates

> Templates de comunicação adaptados por perfil DISC

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `disc_type` | `character varying(1)` | não |  |  |  |
| 3 | `template_type` | `character varying(50)` | não |  |  |  |
| 4 | `title` | `character varying(200)` | não |  |  |  |
| 5 | `content` | `text` | não |  |  |  |
| 6 | `tone` | `character varying(50)` | sim |  |  |  |
| 7 | `key_phrases` | `text[]` | sim |  |  |  |
| 8 | `avoid_phrases` | `text[]` | sim |  |  |  |
| 9 | `example_subject` | `character varying(200)` | sim |  |  |  |
| 10 | `is_active` | `boolean` | sim | `true` |  |  |
| 11 | `success_rate` | `numeric(5,2)` | sim | `0` |  |  |
| 12 | `usage_count` | `integer` | sim | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_templates_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| disc_templates_disc_type_check | CHECK | `CHECK (disc_type::text = ANY (ARRAY['D'::character varying::text, 'I'::character varying::text, 'S'::character varying::text, 'C'::character varying::text]))` |  |  | sim |
| disc_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_templates_pkey ON public.disc_templates USING btree (id)` |
| idx_disc_templates_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_disc_templates_created_by ON public.disc_templates USING btree (created_by)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_disc_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
