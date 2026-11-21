# public.revops_alerts

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
| 3 | `metric_key` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não |  |  |  |
| 5 | `message` | `text` | não |  |  |  |
| 6 | `current_value` | `numeric(14,2)` | sim |  |  |  |
| 7 | `expected_value` | `numeric(14,2)` | sim |  |  |  |
| 8 | `period` | `date` | sim |  |  |  |
| 9 | `dismissed` | `boolean` | não | `false` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| revops_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| revops_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_revops_alerts_user_active | btree | user_id, dismissed, created_at | não | sim |  | `CREATE INDEX idx_revops_alerts_user_active ON public.revops_alerts USING btree (user_id, dismissed, created_at DESC)` |
| revops_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX revops_alerts_pkey ON public.revops_alerts USING btree (id)` |


## Policies (RLS)

### `Users delete own alerts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
