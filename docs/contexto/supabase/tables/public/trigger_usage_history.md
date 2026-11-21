# public.trigger_usage_history

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `trigger_type_id` | `uuid` | sim |  |  |  |
| 5 | `trigger_bundle_id` | `uuid` | sim |  |  |  |
| 6 | `channel` | `text` | não |  |  |  |
| 7 | `sent_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `clicked_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `converted_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `response_text` | `text` | sim |  |  |  |
| 12 | `sentiment` | `text` | sim |  |  |  |
| 13 | `effectiveness_score` | `numeric` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `trigger_type` | `text` | sim |  |  |  |
| 17 | `template_id` | `text` | sim |  |  |  |
| 18 | `template_title` | `text` | sim |  |  |  |
| 19 | `scenario` | `text` | sim |  |  |  |
| 20 | `context` | `text` | sim |  |  |  |
| 21 | `result` | `text` | sim |  |  |  |
| 22 | `notes` | `text` | sim |  |  |  |
| 23 | `effectiveness_rating` | `integer` | sim |  |  |  |
| 24 | `used_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_usage_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_usage_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_trigger_usage_history_contact_id ON public.trigger_usage_history USING btree (contact_id)` |
| idx_trigger_usage_history_used_at | btree | used_at | não | sim |  | `CREATE INDEX idx_trigger_usage_history_used_at ON public.trigger_usage_history USING btree (used_at DESC)` |
| idx_trigger_usage_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_trigger_usage_history_user_id ON public.trigger_usage_history USING btree (user_id)` |
| trigger_usage_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_usage_history_pkey ON public.trigger_usage_history USING btree (id)` |


## Policies (RLS)

### `Users can delete their own trigger usage history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own trigger usage history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own trigger usage history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own trigger usage history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `trigger_usage_history_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_usage_history_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `trigger_usage_history_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_usage_history_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
