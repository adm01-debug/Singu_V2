# _dormant.circuit_breaker_events

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
| 2 | `circuit_name` | `text` | não |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `failure_count` | `integer` | sim | `0` |  |  |
| 5 | `last_failure_reason` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| circuit_breaker_events_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['opened'::text, 'closed'::text, 'half_open'::text]))` |  |  | sim |
| circuit_breaker_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| circuit_breaker_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX circuit_breaker_events_pkey ON _dormant.circuit_breaker_events USING btree (id)` |


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
