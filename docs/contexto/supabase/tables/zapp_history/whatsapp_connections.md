# zapp_history.whatsapp_connections

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `instance_name` | `text` | não |  |  | Nome único da instância na Evolution API. Usado nas chamadas REST para baixar mídia/áudio. |
| 3 | `display_name` | `text` | sim |  |  |  |
| 4 | `phone_number` | `text` | sim |  |  |  |
| 5 | `evolution_base_url` | `text` | sim |  |  |  |
| 6 | `owner_user_id` | `uuid` | sim |  |  | Profile responsável pela instância. Recebe alertas de queda. |
| 7 | `status` | `text` | não | `'disconnected'::text` |  | connected \| disconnected \| qr_pending \| error \| banned |
| 8 | `qr_code` | `text` | sim |  |  |  |
| 9 | `last_connected_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `webhook_url` | `text` | sim |  |  |  |
| 11 | `config` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_wc_status_valid | CHECK | `CHECK (status = ANY (ARRAY['connected'::text, 'disconnected'::text, 'connecting'::text, 'error'::text]))` |  |  | sim |
| whatsapp_connections_instance_name_key | UNIQUE | `UNIQUE (instance_name)` |  |  | sim |
| whatsapp_connections_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| whatsapp_connections_status_check | CHECK | `CHECK (status = ANY (ARRAY['connected'::text, 'disconnected'::text, 'qr_pending'::text, 'error'::text, 'banned'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| zapp_history.conversations | conversations_whatsapp_connection_id_fkey | whatsapp_connection_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| whatsapp_connections_instance_name_key | btree | instance_name | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_connections_instance_name_key ON zapp_history.whatsapp_connections USING btree (instance_name)` |
| whatsapp_connections_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_connections_pkey ON zapp_history.whatsapp_connections USING btree (id)` |


## Policies (RLS)

### `wc_owner_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `((owner_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_whatsapp_connections_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

_nenhum_
