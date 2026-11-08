# _dormant.security_alert_settings

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `notify_new_device` | `boolean` | não | `true` |  |  |
| 4 | `notify_failed_login` | `boolean` | não | `true` |  |  |
| 5 | `notify_password_change` | `boolean` | não | `true` |  |  |
| 6 | `notify_role_change` | `boolean` | não | `true` |  |  |
| 7 | `max_failed_attempts` | `integer` | não | `5` |  |  |
| 8 | `alert_cooldown_minutes` | `integer` | não | `30` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| security_alert_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| security_alert_settings_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| security_alert_settings_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| security_alert_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX security_alert_settings_pkey ON _dormant.security_alert_settings USING btree (id)` |
| security_alert_settings_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX security_alert_settings_user_id_key ON _dormant.security_alert_settings USING btree (user_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
