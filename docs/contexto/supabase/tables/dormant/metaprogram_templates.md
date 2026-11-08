# _dormant.metaprogram_templates

> Templates adaptados por metaprograma de PNL

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
| 2 | `metaprogram_dimension` | `character varying(50)` | não |  |  |  |
| 3 | `metaprogram_pole` | `character varying(50)` | não |  |  |  |
| 4 | `template_type` | `character varying(50)` | não |  |  |  |
| 5 | `title` | `character varying(200)` | não |  |  |  |
| 6 | `content` | `text` | não |  |  |  |
| 7 | `language_patterns` | `text[]` | sim |  |  |  |
| 8 | `motivation_triggers` | `text[]` | sim |  |  |  |
| 9 | `resistance_triggers` | `text[]` | sim |  |  |  |
| 10 | `is_active` | `boolean` | sim | `true` |  |  |
| 11 | `success_rate` | `numeric(5,2)` | sim | `0` |  |  |
| 12 | `usage_count` | `integer` | sim | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| metaprogram_templates_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| metaprogram_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| metaprogram_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX metaprogram_templates_pkey ON _dormant.metaprogram_templates USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_metaprogram_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
