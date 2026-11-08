# _dormant.dashboard_layouts

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `layout_name` | `text` | não | `'default'::text` |  |  |
| 4 | `widgets` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 5 | `is_active` | `boolean` | não | `true` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dashboard_layouts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| dashboard_layouts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| dashboard_layouts_user_id_layout_name_key | UNIQUE | `UNIQUE (user_id, layout_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dashboard_layouts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dashboard_layouts_pkey ON _dormant.dashboard_layouts USING btree (id)` |
| dashboard_layouts_user_id_layout_name_key | btree | user_id, layout_name | sim | sim |  | `CREATE UNIQUE INDEX dashboard_layouts_user_id_layout_name_key ON _dormant.dashboard_layouts USING btree (user_id, layout_name)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
