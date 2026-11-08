# _dormant.personalized_message_templates

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
| 2 | `template_name` | `character varying(255)` | não |  |  |  |
| 3 | `template_code` | `character varying(50)` | sim |  |  |  |
| 4 | `template_type` | `character varying(50)` | sim |  |  |  |
| 5 | `purpose` | `character varying(100)` | sim |  |  |  |
| 6 | `subject_template` | `text` | sim |  |  |  |
| 7 | `body_template` | `text` | não |  |  |  |
| 8 | `available_variables` | `text[]` | sim |  |  |  |
| 9 | `disc_adaptations` | `jsonb` | sim |  |  |  |
| 10 | `vak_adaptations` | `jsonb` | sim |  |  |  |
| 11 | `triggers_used` | `text[]` | sim |  |  |  |
| 12 | `open_rate` | `numeric(5,2)` | sim |  |  |  |
| 13 | `response_rate` | `numeric(5,2)` | sim |  |  |  |
| 14 | `conversion_rate` | `numeric(5,2)` | sim |  |  |  |
| 15 | `times_used` | `integer` | sim | `0` |  |  |
| 16 | `is_active` | `boolean` | sim | `true` |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| personalized_message_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| personalized_message_templates_template_code_key | UNIQUE | `UNIQUE (template_code)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| personalized_message_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX personalized_message_templates_pkey ON _dormant.personalized_message_templates USING btree (id)` |
| personalized_message_templates_template_code_key | btree | template_code | sim | sim |  | `CREATE UNIQUE INDEX personalized_message_templates_template_code_key ON _dormant.personalized_message_templates USING btree (template_code)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
