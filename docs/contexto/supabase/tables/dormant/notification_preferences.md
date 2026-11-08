# _dormant.notification_preferences

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
| 2 | `email` | `text` | não |  |  |  |
| 3 | `is_active` | `boolean` | não | `true` |  |  |
| 4 | `frequency` | `text` | não | `'daily'::text` |  |  |
| 5 | `notify_stagnant_deals` | `boolean` | não | `true` |  |  |
| 6 | `notify_inactive_clients` | `boolean` | não | `true` |  |  |
| 7 | `notify_at_risk_goals` | `boolean` | não | `true` |  |  |
| 8 | `stagnant_threshold_days` | `integer` | não | `14` |  |  |
| 9 | `inactive_threshold_days` | `integer` | não | `60` |  |  |
| 10 | `preferred_time` | `time without time zone` | não | `'08:00:00'::time without time zone` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| valid_frequency | CHECK | `CHECK (frequency = ANY (ARRAY['realtime'::text, 'daily'::text, 'weekly'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notification_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notification_preferences_pkey ON _dormant.notification_preferences USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
