# public.sync_log

> Log de sincronização com Bitrix24

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
| usada por views | public.vw_grupos_economicos_resumo, public.vw_historico_carteira, public.vw_historico_carteira_empresa |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `sync_type` | `character varying(50)` | não |  |  |  |
| 3 | `direction` | `character varying(20)` | não |  |  |  |
| 4 | `entity_id` | `uuid` | sim |  |  |  |
| 5 | `bitrix_id` | `integer` | sim |  |  |  |
| 6 | `status` | `character varying(20)` | não |  |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `records_processed` | `integer` | sim | `0` |  |  |
| 9 | `records_created` | `integer` | sim | `0` |  |  |
| 10 | `records_updated` | `integer` | sim | `0` |  |  |
| 11 | `records_failed` | `integer` | sim | `0` |  |  |
| 12 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sync_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sync_log_created | btree | created_at | não | sim |  | `CREATE INDEX idx_sync_log_created ON public.sync_log USING btree (created_at DESC)` |
| idx_sync_log_status | btree | status | não | sim |  | `CREATE INDEX idx_sync_log_status ON public.sync_log USING btree (status)` |
| idx_sync_log_type | btree | sync_type, direction | não | sim |  | `CREATE INDEX idx_sync_log_type ON public.sync_log USING btree (sync_type, direction)` |
| sync_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sync_log_pkey ON public.sync_log USING btree (id)` |


## Policies (RLS)

### `sync_log_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `sync_log_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
