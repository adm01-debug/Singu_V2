# public.lead_score_thresholds

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
| 3 | `grade` | `text` | não |  |  |  |
| 4 | `min_score` | `numeric(5,2)` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_thresholds_grade_check | CHECK | `CHECK (grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text]))` |  |  | sim |
| lead_score_thresholds_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_score_thresholds_user_id_grade_key | UNIQUE | `UNIQUE (user_id, grade)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_score_thresholds_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_thresholds_pkey ON public.lead_score_thresholds USING btree (id)` |
| lead_score_thresholds_user_id_grade_key | btree | user_id, grade | sim | sim |  | `CREATE UNIQUE INDEX lead_score_thresholds_user_id_grade_key ON public.lead_score_thresholds USING btree (user_id, grade)` |


## Policies (RLS)

### `lead_score_thresholds_delete_own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `lead_score_thresholds_insert_own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `lead_score_thresholds_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `lead_score_thresholds_update_own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tg_lead_score_thresholds_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
