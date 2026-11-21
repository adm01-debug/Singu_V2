# public.connection_quotas

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
| 2 | `webhook_id` | `uuid` | não |  |  |  |
| 3 | `period_start` | `date` | não | `(date_trunc('month'::text, now()))::date` |  |  |
| 4 | `calls_limit` | `integer` | não | `10000` |  |  |
| 5 | `calls_used` | `integer` | não | `0` |  |  |
| 6 | `overage_blocked` | `boolean` | não | `true` |  |  |
| 7 | `alert_sent_80` | `boolean` | não | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| connection_quotas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| connection_quotas_webhook_id_period_start_key | UNIQUE | `UNIQUE (webhook_id, period_start)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| connection_quotas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX connection_quotas_pkey ON public.connection_quotas USING btree (id)` |
| connection_quotas_webhook_id_period_start_key | btree | webhook_id, period_start | sim | sim |  | `CREATE UNIQUE INDEX connection_quotas_webhook_id_period_start_key ON public.connection_quotas USING btree (webhook_id, period_start)` |
| idx_connection_quotas_webhook_period | btree | webhook_id, period_start | não | sim |  | `CREATE INDEX idx_connection_quotas_webhook_period ON public.connection_quotas USING btree (webhook_id, period_start DESC)` |


## Policies (RLS)

### `Admins manage connection quotas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `users_read_own_connection_quotas`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM incoming_webhooks w   WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
