# _dormant.dashboard_widgets

> SINGU: Configuração personalizada do dashboard

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `widget_type` | `text` | não |  |  |  |
| 4 | `position_x` | `integer` | sim | `0` |  |  |
| 5 | `position_y` | `integer` | sim | `0` |  |  |
| 6 | `width` | `integer` | sim | `1` |  |  |
| 7 | `height` | `integer` | sim | `1` |  |  |
| 8 | `config` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `is_visible` | `boolean` | sim | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dashboard_widgets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| dashboard_widgets_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dashboard_widgets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dashboard_widgets_pkey ON _dormant.dashboard_widgets USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_dashboard_widgets`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
