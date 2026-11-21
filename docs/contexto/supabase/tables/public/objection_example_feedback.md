# public.objection_example_feedback

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
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `objection` | `text` | não |  |  |  |
| 4 | `category` | `text` | sim |  |  |  |
| 5 | `interaction_id` | `uuid` | sim |  |  |  |
| 6 | `is_useful` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| objection_example_feedback_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| objection_example_feedback_unique | UNIQUE | `UNIQUE (user_id, objection, interaction_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_objection_example_feedback_user_objection | btree | user_id, objection | não | sim |  | `CREATE INDEX idx_objection_example_feedback_user_objection ON public.objection_example_feedback USING btree (user_id, objection)` |
| objection_example_feedback_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX objection_example_feedback_pkey ON public.objection_example_feedback USING btree (id)` |
| objection_example_feedback_unique | btree | user_id, objection, interaction_id | sim | sim |  | `CREATE UNIQUE INDEX objection_example_feedback_unique ON public.objection_example_feedback USING btree (user_id, objection, interaction_id)` |


## Policies (RLS)

### `Users delete own objection feedback`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own objection feedback`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own objection feedback`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own objection feedback`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_objection_example_feedback_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
