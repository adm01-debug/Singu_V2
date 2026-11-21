# public.win_loss_insights

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `period_start` | `timestamp with time zone` | não |  |  |  |
| 4 | `period_end` | `timestamp with time zone` | não |  |  |  |
| 5 | `insight_type` | `text` | não |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `description` | `text` | não |  |  |  |
| 8 | `severity` | `text` | não | `'info'::text` |  |  |
| 9 | `supporting_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `generated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| win_loss_insights_insight_type_check | CHECK | `CHECK (insight_type = ANY (ARRAY['pattern'::text, 'recommendation'::text, 'alert'::text]))` |  |  | sim |
| win_loss_insights_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| win_loss_insights_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text, 'success'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_win_loss_insights_user_generated | btree | user_id, generated_at | não | sim |  | `CREATE INDEX idx_win_loss_insights_user_generated ON public.win_loss_insights USING btree (user_id, generated_at DESC)` |
| win_loss_insights_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX win_loss_insights_pkey ON public.win_loss_insights USING btree (id)` |


## Policies (RLS)

### `users delete own insights`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `users insert own insights`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `users view own insights`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
