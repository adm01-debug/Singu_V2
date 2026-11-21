# public.score_history

> Historical record of all calculated scores for contacts

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `score_type` | `text` | não |  |  |  |
| 5 | `score_value` | `numeric` | não |  |  |  |
| 6 | `previous_value` | `numeric` | sim |  |  |  |
| 7 | `factors` | `jsonb` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim |  |  |  |
| 9 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_score_history_calculated_at | btree | calculated_at | não | sim |  | `CREATE INDEX idx_score_history_calculated_at ON public.score_history USING btree (calculated_at DESC)` |
| idx_score_history_composite | btree | contact_id, score_type, calculated_at | não | sim |  | `CREATE INDEX idx_score_history_composite ON public.score_history USING btree (contact_id, score_type, calculated_at DESC)` |
| idx_score_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_score_history_contact_id ON public.score_history USING btree (contact_id)` |
| idx_score_history_score_type | btree | score_type | não | sim |  | `CREATE INDEX idx_score_history_score_type ON public.score_history USING btree (score_type)` |
| idx_score_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_score_history_user_id ON public.score_history USING btree (user_id)` |
| score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX score_history_pkey ON public.score_history USING btree (id)` |


## Policies (RLS)

### `Users can delete their own score history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own score history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own score_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own score history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `score_history_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `score_history_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `score_history_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `score_history_update`

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
