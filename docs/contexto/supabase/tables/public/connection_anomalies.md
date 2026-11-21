# public.connection_anomalies

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
| 2 | `webhook_id` | `uuid` | sim |  |  |  |
| 3 | `connection_id` | `uuid` | sim |  |  |  |
| 4 | `anomaly_type` | `text` | não |  |  |  |
| 5 | `severity` | `text` | não | `'medium'::text` |  |  |
| 6 | `explanation` | `text` | não |  |  |  |
| 7 | `metrics` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 8 | `window_start` | `timestamp with time zone` | não |  |  |  |
| 9 | `window_end` | `timestamp with time zone` | não |  |  |  |
| 10 | `detected_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `acknowledged_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `acknowledged_by` | `uuid` | sim |  |  |  |
| 13 | `model_used` | `text` | sim |  |  |  |
| 14 | `confidence` | `numeric(4,3)` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| connection_anomalies_anomaly_type_check | CHECK | `CHECK (anomaly_type = ANY (ARRAY['error_spike'::text, 'latency_degradation'::text, 'suspicious_window'::text, 'volume_drop'::text, 'volume_spike'::text, 'schema_drift'::text]))` |  |  | sim |
| connection_anomalies_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| connection_anomalies_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| connection_anomalies_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| connection_anomalies_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX connection_anomalies_pkey ON public.connection_anomalies USING btree (id)` |
| idx_connection_anomalies_severity | btree | severity, detected_at | não | sim | `(acknowledged_at IS NULL)` | `CREATE INDEX idx_connection_anomalies_severity ON public.connection_anomalies USING btree (severity, detected_at DESC) WHERE (acknowledged_at IS NULL)` |
| idx_connection_anomalies_webhook | btree | webhook_id, detected_at | não | sim |  | `CREATE INDEX idx_connection_anomalies_webhook ON public.connection_anomalies USING btree (webhook_id, detected_at DESC)` |


## Policies (RLS)

### `Admins can delete anomalies`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update anomalies`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view anomalies`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Only service role inserts anomalies`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | service_role |
| USING |  |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
