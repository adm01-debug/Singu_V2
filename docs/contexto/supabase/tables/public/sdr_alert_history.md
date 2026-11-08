# public.sdr_alert_history

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `triggered_by` | `text` | sim | `'cron'::text` |  |  |
| 4 | `sdrs_notified` | `integer` | não | `0` |  |  |
| 5 | `threshold_used` | `integer` | não | `3` |  |  |
| 6 | `sdr_details` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `admin_emails` | `text[]` | não | `'{}'::text[]` |  |  |
| 8 | `consecutive_days_threshold` | `integer` | não | `3` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sdr_alert_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sdr_alert_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sdr_alert_history_pkey ON public.sdr_alert_history USING btree (id)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
