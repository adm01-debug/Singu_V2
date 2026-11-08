# _dormant.health_alert_settings

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `email_notifications` | `boolean` | sim | `true` |  |  |
| 4 | `push_notifications` | `boolean` | sim | `true` |  |  |
| 5 | `critical_threshold` | `integer` | sim | `30` |  |  |
| 6 | `warning_threshold` | `integer` | sim | `50` |  |  |
| 7 | `check_frequency_hours` | `integer` | sim | `24` |  |  |
| 8 | `notify_on_critical` | `boolean` | sim | `true` |  |  |
| 9 | `notify_on_warning` | `boolean` | sim | `false` |  |  |
| 10 | `email_address` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| health_alert_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| unique_user_health_settings | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| health_alert_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX health_alert_settings_pkey ON _dormant.health_alert_settings USING btree (id)` |
| unique_user_health_settings | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX unique_user_health_settings ON _dormant.health_alert_settings USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own health settings`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own health_alert_settings`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own health settings`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own health settings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_health_alert_settings | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
