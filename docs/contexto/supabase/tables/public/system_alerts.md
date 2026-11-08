# public.system_alerts

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
| 2 | `alert_type` | `text` | não |  |  |  |
| 3 | `severity` | `text` | não |  |  |  |
| 4 | `threshold_pct` | `numeric` | não |  |  |  |
| 5 | `consumed_pct` | `numeric` | não |  |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 8 | `acknowledged_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `acknowledged_by` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `is_simulated` | `boolean` | sim | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| system_alerts_acknowledged_by_fkey | FOREIGN KEY | `FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| system_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| system_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['warning'::text, 'high'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_system_alerts_active_by_type | btree | alert_type, created_at | não | sim | `(acknowledged_at IS NULL)` | `CREATE INDEX idx_system_alerts_active_by_type ON public.system_alerts USING btree (alert_type, created_at DESC) WHERE (acknowledged_at IS NULL)` |
| idx_system_alerts_real_unack | btree | alert_type, created_at | não | sim | `((is_simulated = false) AND (acknowledged_at IS NULL))` | `CREATE INDEX idx_system_alerts_real_unack ON public.system_alerts USING btree (alert_type, created_at DESC) WHERE ((is_simulated = false) AND (acknowledged_at IS NULL))` |
| idx_system_alerts_simulated | btree | created_at | não | sim | `(is_simulated = true)` | `CREATE INDEX idx_system_alerts_simulated ON public.system_alerts USING btree (created_at DESC) WHERE (is_simulated = true)` |
| idx_system_alerts_type_created | btree | alert_type, created_at | não | sim |  | `CREATE INDEX idx_system_alerts_type_created ON public.system_alerts USING btree (alert_type, created_at DESC)` |
| idx_system_alerts_unack | btree | created_at | não | sim | `(acknowledged_at IS NULL)` | `CREATE INDEX idx_system_alerts_unack ON public.system_alerts USING btree (created_at DESC) WHERE (acknowledged_at IS NULL)` |
| system_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX system_alerts_pkey ON public.system_alerts USING btree (id)` |


## Policies (RLS)

### `Admins can acknowledge system alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins can view system alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notify_admins_critical_behavioral | AFTER | INSERT | ROW | enabled | public.notify_admins_on_critical_behavioral_alert |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
