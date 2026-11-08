# _dormant.whatsapp_instances

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `instance_name` | `text` | não |  |  |  |
| 4 | `display_name` | `text` | sim |  |  |  |
| 5 | `phone_number` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim | `'disconnected'::text` |  |  |
| 7 | `profile_pic_url` | `text` | sim |  |  |  |
| 8 | `webhook_url` | `text` | sim |  |  |  |
| 9 | `auto_read_messages` | `boolean` | sim | `false` |  |  |
| 10 | `auto_reply_enabled` | `boolean` | sim | `false` |  |  |
| 11 | `auto_reply_message` | `text` | sim |  |  |  |
| 12 | `settings` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `last_connected_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| whatsapp_instances_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| whatsapp_instances_user_id_instance_name_key | UNIQUE | `UNIQUE (user_id, instance_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| whatsapp_instances_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_instances_pkey ON _dormant.whatsapp_instances USING btree (id)` |
| whatsapp_instances_user_id_instance_name_key | btree | user_id, instance_name | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_instances_user_id_instance_name_key ON _dormant.whatsapp_instances USING btree (user_id, instance_name)` |


## Policies (RLS)

### `Users can manage their own whatsapp_instances`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_whatsapp_instances | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
