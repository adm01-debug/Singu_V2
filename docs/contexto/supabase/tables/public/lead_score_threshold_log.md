# public.lead_score_threshold_log

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `automation_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | não |  |  |  |
| 5 | `from_grade` | `text` | sim |  |  |  |
| 6 | `to_grade` | `text` | sim |  |  |  |
| 7 | `from_score` | `numeric` | sim |  |  |  |
| 8 | `to_score` | `numeric` | sim |  |  |  |
| 9 | `action_result` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 10 | `success` | `boolean` | não | `true` |  |  |
| 11 | `fired_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_threshold_log_automation_id_fkey | FOREIGN KEY | `FOREIGN KEY (automation_id) REFERENCES lead_score_threshold_automations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_score_threshold_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_score_threshold_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_threshold_log_pkey ON public.lead_score_threshold_log USING btree (id)` |


## Policies (RLS)

### `log insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `log select own`

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
