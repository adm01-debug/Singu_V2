# public.notification_logs

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
| 2 | `reminder_id` | `text` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `channel` | `text` | não |  |  |  |
| 6 | `sent_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  |  |
| 7 | `delivery_status` | `text` | não | `'sent'::text` |  |  |
| 8 | `claim_expires_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `claim_token` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_logs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| notification_logs_delivery_status_check | CHECK | `CHECK (delivery_status = ANY (ARRAY['pending'::text, 'sent'::text, 'unknown'::text, 'rejected'::text]))` |  |  | sim |
| notification_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notification_logs_reminder_id_channel_key | UNIQUE | `UNIQUE (reminder_id, channel)` |  |  | sim |
| notification_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notification_logs_pending_expiration_idx | btree | claim_expires_at | não | sim | `(delivery_status = 'pending'::text)` | `CREATE INDEX notification_logs_pending_expiration_idx ON public.notification_logs USING btree (claim_expires_at) WHERE (delivery_status = 'pending'::text)` |
| notification_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notification_logs_pkey ON public.notification_logs USING btree (id)` |
| notification_logs_reminder_id_channel_key | btree | reminder_id, channel | sim | sim |  | `CREATE UNIQUE INDEX notification_logs_reminder_id_channel_key ON public.notification_logs USING btree (reminder_id, channel)` |


## Policies (RLS)

### `Users can view their own notification logs`

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
