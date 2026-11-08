# _dormant.trigger_usage_history

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `trigger_type` | `text` | não |  |  |  |
| 5 | `template_id` | `text` | sim |  |  |  |
| 6 | `template_title` | `text` | sim |  |  |  |
| 7 | `scenario` | `text` | sim |  |  |  |
| 8 | `channel` | `text` | sim |  |  |  |
| 9 | `context` | `text` | sim |  |  |  |
| 10 | `result` | `text` | sim |  |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `effectiveness_rating` | `integer` | sim |  |  |  |
| 13 | `used_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_usage_history_effectiveness_rating_check | CHECK | `CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5)` |  |  | sim |
| trigger_usage_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_usage_history_result_check | CHECK | `CHECK (result = ANY (ARRAY['success'::text, 'neutral'::text, 'failure'::text, 'pending'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| trigger_usage_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_usage_history_pkey ON _dormant.trigger_usage_history USING btree (id)` |


## Policies (RLS)

### `Users can delete their own trigger usage history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own trigger usage history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own trigger usage history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own trigger usage history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
