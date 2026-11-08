# _dormant.user_favorite_templates

> Templates favoritos salvos por cada usuário

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `template_type` | `character varying(50)` | não |  |  |  |
| 4 | `template_id` | `uuid` | não |  |  |  |
| 5 | `notes` | `text` | sim |  |  |  |
| 6 | `usage_count` | `integer` | sim | `0` |  |  |
| 7 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_favorite_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_favorite_templates_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| user_favorite_templates_user_id_template_type_template_id_key | UNIQUE | `UNIQUE (user_id, template_type, template_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_favorite_templates_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_favorite_templates_pkey ON _dormant.user_favorite_templates USING btree (id)` |
| user_favorite_templates_user_id_template_type_template_id_key | btree | user_id, template_type, template_id | sim | sim |  | `CREATE UNIQUE INDEX user_favorite_templates_user_id_template_type_template_id_key ON _dormant.user_favorite_templates USING btree (user_id, template_type, template_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
