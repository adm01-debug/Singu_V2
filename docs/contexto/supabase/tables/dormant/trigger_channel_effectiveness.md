# _dormant.trigger_channel_effectiveness

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `trigger_type` | `text` | não |  |  |  |
| 5 | `channel` | `text` | não |  |  |  |
| 6 | `uses` | `integer` | sim | `0` |  |  |
| 7 | `successes` | `integer` | sim | `0` |  |  |
| 8 | `effectiveness_score` | `numeric(5,2)` | sim | `0` |  |  |
| 9 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_channel_effectiveness_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['whatsapp'::text, 'email'::text, 'call'::text, 'meeting'::text, 'linkedin'::text, 'sms'::text]))` |  |  | sim |
| trigger_channel_effectiveness_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_channel_effectiveness_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key | UNIQUE | `UNIQUE (user_id, contact_id, trigger_type, channel)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_channel_effectiveness_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_trigger_channel_effectiveness_user_contact ON _dormant.trigger_channel_effectiveness USING btree (user_id, contact_id)` |
| trigger_channel_effectiveness_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_channel_effectiveness_pkey ON _dormant.trigger_channel_effectiveness USING btree (id)` |
| trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key | btree | user_id, contact_id, trigger_type, channel | sim | sim |  | `CREATE UNIQUE INDEX trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key ON _dormant.trigger_channel_effectiveness USING btree (user_id, contact_id, trigger_type, channel)` |


## Policies (RLS)

### `Users can create their own channel effectiveness`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own channel effectiveness`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own channel effectiveness`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own channel effectiveness`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_trigger_channel_effectiveness | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
