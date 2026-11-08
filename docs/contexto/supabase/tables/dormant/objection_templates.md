# _dormant.objection_templates

> SINGU: Templates de resposta para objeções comuns

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `category` | `text` | não |  |  |  |
| 4 | `objection_pattern` | `text` | não |  |  |  |
| 5 | `name` | `text` | não |  |  |  |
| 6 | `response_template` | `text` | não |  |  |  |
| 7 | `response_template_pt` | `text` | sim |  |  |  |
| 8 | `disc_variations` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `technique` | `text` | sim |  |  |  |
| 10 | `times_used` | `integer` | sim | `0` |  |  |
| 11 | `success_count` | `integer` | sim | `0` |  |  |
| 12 | `success_rate` | `numeric(5,2)` | sim |  |  |  |
| 13 | `is_active` | `boolean` | sim | `true` |  |  |
| 14 | `is_global` | `boolean` | sim | `false` |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| objection_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| objection_templates_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| objection_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX objection_templates_pkey ON _dormant.objection_templates USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_objection_templates`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
