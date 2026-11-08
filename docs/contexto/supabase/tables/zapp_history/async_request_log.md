# zapp_history.async_request_log

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `bigint` | não | `nextval('zapp_history.async_request_log_id_seq'::regclass)` |  |  |
| 2 | `request_kind` | `text` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `pg_net_request_id` | `bigint` | sim |  |  |  |
| 6 | `payload_preview` | `text` | sim |  |  |  |
| 7 | `triggered_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `status` | `text` | sim | `'dispatched'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| async_request_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| async_request_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX async_request_log_pkey ON zapp_history.async_request_log USING btree (id)` |
| idx_arl_entity | btree | entity_type, entity_id | não | sim |  | `CREATE INDEX idx_arl_entity ON zapp_history.async_request_log USING btree (entity_type, entity_id)` |
| idx_arl_kind_time | btree | request_kind, triggered_at | não | sim |  | `CREATE INDEX idx_arl_kind_time ON zapp_history.async_request_log USING btree (request_kind, triggered_at DESC)` |


## Policies (RLS)

### `arl_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
