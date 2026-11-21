# public.forecast_quota_settings

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `default_monthly_quota` | `numeric` | não | `0` |  |  |
| 4 | `default_quarterly_quota` | `numeric` | não | `0` |  |  |
| 5 | `health_weight_activity` | `integer` | não | `30` |  |  |
| 6 | `health_weight_stage_age` | `integer` | não | `25` |  |  |
| 7 | `health_weight_engagement` | `integer` | não | `25` |  |  |
| 8 | `health_weight_relationship` | `integer` | não | `20` |  |  |
| 9 | `inactivity_threshold_days` | `integer` | não | `14` |  |  |
| 10 | `slip_threshold_days` | `integer` | não | `7` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| forecast_quota_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| forecast_quota_settings_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| forecast_quota_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX forecast_quota_settings_pkey ON public.forecast_quota_settings USING btree (id)` |
| forecast_quota_settings_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX forecast_quota_settings_user_id_key ON public.forecast_quota_settings USING btree (user_id)` |


## Policies (RLS)

### `own quota_settings insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `own quota_settings select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `own quota_settings update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_quota_settings_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
