# _dormant.trigger_intensity_history

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
| 5 | `intensity_level` | `integer` | não |  |  |  |
| 6 | `result` | `text` | sim |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `interaction_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_intensity_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_intensity_history_intensity_level_check | CHECK | `CHECK (intensity_level >= 1 AND intensity_level <= 5)` |  |  | sim |
| trigger_intensity_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| trigger_intensity_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_intensity_history_result_check | CHECK | `CHECK (result = ANY (ARRAY['success'::text, 'neutral'::text, 'failure'::text, 'resistance'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_intensity_history_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_trigger_intensity_history_user_contact ON _dormant.trigger_intensity_history USING btree (user_id, contact_id)` |
| trigger_intensity_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_intensity_history_pkey ON _dormant.trigger_intensity_history USING btree (id)` |


## Policies (RLS)

### `Users can create their own intensity history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own intensity history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own intensity history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own intensity history`

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
