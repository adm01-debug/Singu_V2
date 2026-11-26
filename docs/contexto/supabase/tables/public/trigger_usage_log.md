# public.trigger_usage_log

> SINGU: Log de uso de gatilhos mentais e seus resultados

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `trigger_code` | `text` | não |  |  |  |
| 6 | `bundle_code` | `text` | sim |  |  |  |
| 7 | `context` | `text` | sim |  |  |  |
| 8 | `intensity_used` | `integer` | sim |  |  |  |
| 9 | `message_excerpt` | `text` | sim |  |  |  |
| 10 | `outcome` | `text` | sim |  |  |  |
| 11 | `response_received` | `boolean` | sim |  |  |  |
| 12 | `response_time_minutes` | `integer` | sim |  |  |  |
| 13 | `led_to_conversion` | `boolean` | sim |  |  |  |
| 14 | `notes` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_usage_log_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_usage_log_intensity_used_check | CHECK | `CHECK (intensity_used >= 1 AND intensity_used <= 5)` |  |  | sim |
| trigger_usage_log_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| trigger_usage_log_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'no_response'::text, 'pending'::text]))` |  |  | sim |
| trigger_usage_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_usage_log_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| trigger_usage_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_usage_log_pkey ON public.trigger_usage_log USING btree (id)` |


## Policies (RLS)

### `service_role_full_trigger_usage_log`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `trigger_usage_log_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_owner_from_contact | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_owner_from_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
