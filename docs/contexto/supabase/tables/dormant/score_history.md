# _dormant.score_history

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `score_type` | `text` | não |  |  |  |
| 5 | `score_value` | `numeric(5,2)` | não |  |  |  |
| 6 | `previous_value` | `numeric(5,2)` | sim |  |  |  |
| 7 | `factors` | `jsonb` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim |  |  |  |
| 9 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| score_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| score_history_score_type_check | CHECK | `CHECK (score_type = ANY (ARRAY['closing'::text, 'health'::text, 'churn'::text, 'relationship'::text, 'satisfaction'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_score_history_composite | btree | contact_id, score_type, calculated_at | não | sim |  | `CREATE INDEX idx_score_history_composite ON _dormant.score_history USING btree (contact_id, score_type, calculated_at DESC)` |
| score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX score_history_pkey ON _dormant.score_history USING btree (id)` |


## Policies (RLS)

### `Users can delete their own score history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own score history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own score_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own score history`

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
