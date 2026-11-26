# public.trigger_types

> SINGU: Catálogo de tipos de gatilhos mentais

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `code` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `name_pt` | `text` | sim |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `description_pt` | `text` | sim |  |  |  |
| 7 | `category` | `text` | sim |  |  |  |
| 8 | `examples` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `examples_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 10 | `message_templates` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `effective_for_disc` | `text[]` | sim | `'{}'::text[]` |  |  |
| 12 | `avoid_for_disc` | `text[]` | sim | `'{}'::text[]` |  |  |
| 13 | `use_cases` | `text[]` | sim | `'{}'::text[]` |  |  |
| 14 | `default_intensity` | `integer` | sim | `3` |  |  |
| 15 | `is_active` | `boolean` | sim | `true` |  |  |
| 16 | `sort_order` | `integer` | sim | `0` |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_types_category_check | CHECK | `CHECK (category = ANY (ARRAY['urgency'::text, 'social'::text, 'authority'::text, 'reciprocity'::text, 'commitment'::text, 'liking'::text, 'emotion'::text, 'logic'::text, 'value'::text]))` |  |  | sim |
| trigger_types_code_key | UNIQUE | `UNIQUE (code)` |  |  | sim |
| trigger_types_default_intensity_check | CHECK | `CHECK (default_intensity >= 1 AND default_intensity <= 5)` |  |  | sim |
| trigger_types_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.trigger_templates | trigger_templates_trigger_type_id_fkey | trigger_type_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| trigger_types_code_key | btree | code | sim | sim |  | `CREATE UNIQUE INDEX trigger_types_code_key ON public.trigger_types USING btree (code)` |
| trigger_types_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_types_pkey ON public.trigger_types USING btree (id)` |


## Policies (RLS)

### `trigger_types_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `trigger_types_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `trigger_types_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `trigger_types_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
