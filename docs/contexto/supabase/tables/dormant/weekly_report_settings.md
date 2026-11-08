# _dormant.weekly_report_settings

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
| 3 | `enabled` | `boolean` | sim | `true` |  |  |
| 4 | `send_day` | `text` | sim | `'monday'::text` |  |  |
| 5 | `send_time` | `text` | sim | `'09:00'::text` |  |  |
| 6 | `email_address` | `text` | sim |  |  |  |
| 7 | `include_portfolio_summary` | `boolean` | sim | `true` |  |  |
| 8 | `include_at_risk_clients` | `boolean` | sim | `true` |  |  |
| 9 | `include_health_alerts` | `boolean` | sim | `true` |  |  |
| 10 | `include_upcoming_dates` | `boolean` | sim | `true` |  |  |
| 11 | `include_recommendations` | `boolean` | sim | `true` |  |  |
| 12 | `include_performance_metrics` | `boolean` | sim | `true` |  |  |
| 13 | `last_sent_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| unique_user_report_settings | UNIQUE | `UNIQUE (user_id)` |  |  | sim |
| weekly_report_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| unique_user_report_settings | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX unique_user_report_settings ON _dormant.weekly_report_settings USING btree (user_id)` |
| weekly_report_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX weekly_report_settings_pkey ON _dormant.weekly_report_settings USING btree (id)` |


## Policies (RLS)

### `Users can create their own report settings`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own weekly_report_settings`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own report settings`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own report settings`

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
| set_updated_at_weekly_report_settings | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
