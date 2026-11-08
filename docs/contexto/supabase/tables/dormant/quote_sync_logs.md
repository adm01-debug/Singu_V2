# _dormant.quote_sync_logs

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
| 2 | `quote_id` | `uuid` | sim |  |  |  |
| 3 | `sync_direction` | `text` | não |  |  |  |
| 4 | `status` | `text` | não | `'pending'::text` |  |  |
| 5 | `bitrix_deal_id` | `text` | sim |  |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `payload` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quote_sync_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| quote_sync_logs_quote_id_fkey | FOREIGN KEY | `FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| quote_sync_logs_sync_direction_check | CHECK | `CHECK (sync_direction = ANY (ARRAY['to_bitrix'::text, 'from_bitrix'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| quote_sync_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX quote_sync_logs_pkey ON _dormant.quote_sync_logs USING btree (id)` |


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
