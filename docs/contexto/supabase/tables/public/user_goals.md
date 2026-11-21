# public.user_goals

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
| 3 | `goal_type` | `text` | não |  |  |  |
| 4 | `target_value` | `numeric` | não |  |  |  |
| 5 | `current_value` | `numeric` | sim | `0` |  |  |
| 6 | `period_type` | `text` | não |  |  |  |
| 7 | `period_start` | `date` | não |  |  |  |
| 8 | `period_end` | `date` | não |  |  |  |
| 9 | `is_achieved` | `boolean` | sim | `false` |  |  |
| 10 | `achieved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_goals_goal_type_check | CHECK | `CHECK (goal_type = ANY (ARRAY['deals_count'::text, 'deals_value'::text, 'interactions'::text, 'new_companies'::text, 'proposals'::text]))` |  |  | sim |
| user_goals_period_type_check | CHECK | `CHECK (period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text]))` |  |  | sim |
| user_goals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_goals_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_goals_period | btree | period_start, period_end | não | sim |  | `CREATE INDEX idx_user_goals_period ON public.user_goals USING btree (period_start, period_end)` |
| idx_user_goals_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_user_goals_user_id ON public.user_goals USING btree (user_id)` |
| user_goals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_goals_pkey ON public.user_goals USING btree (id)` |


## Policies (RLS)

### `user_goals_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `user_goals_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `user_goals_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `user_goals_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_user_goals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
