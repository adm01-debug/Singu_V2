# _dormant.vak_templates

> Templates adaptados por modalidade sensorial VAK

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `vak_type` | `character varying(1)` | não |  |  |  |
| 3 | `template_type` | `character varying(50)` | não |  |  |  |
| 4 | `title` | `character varying(200)` | não |  |  |  |
| 5 | `content` | `text` | não |  |  |  |
| 6 | `sensory_words` | `text[]` | sim |  |  |  |
| 7 | `recommended_media` | `character varying(50)[]` | sim |  |  |  |
| 8 | `formatting_tips` | `text` | sim |  |  |  |
| 9 | `is_active` | `boolean` | sim | `true` |  |  |
| 10 | `success_rate` | `numeric(5,2)` | sim | `0` |  |  |
| 11 | `usage_count` | `integer` | sim | `0` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| vak_templates_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| vak_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| vak_templates_vak_type_check | CHECK | `CHECK (vak_type::text = ANY (ARRAY['V'::character varying::text, 'A'::character varying::text, 'K'::character varying::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| vak_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX vak_templates_pkey ON _dormant.vak_templates USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_vak_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
