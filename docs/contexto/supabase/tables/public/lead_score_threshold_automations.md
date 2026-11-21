# public.lead_score_threshold_automations

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
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `trigger_type` | `text` | não |  |  |  |
| 6 | `grade_target` | `text` | sim |  |  |  |
| 7 | `score_target` | `integer` | sim |  |  |  |
| 8 | `action_type` | `text` | não |  |  |  |
| 9 | `action_config` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 10 | `cooldown_hours` | `integer` | não | `24` |  |  |
| 11 | `active` | `boolean` | não | `true` |  |  |
| 12 | `last_fired_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `fired_count` | `integer` | não | `0` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_threshold_automations_action_type_check | CHECK | `CHECK (action_type = ANY (ARRAY['notify'::text, 'create_task'::text, 'enroll_sequence'::text, 'webhook'::text, 'tag'::text]))` |  |  | sim |
| lead_score_threshold_automations_cooldown_hours_check | CHECK | `CHECK (cooldown_hours >= 0)` |  |  | sim |
| lead_score_threshold_automations_grade_target_check | CHECK | `CHECK (grade_target = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text]))` |  |  | sim |
| lead_score_threshold_automations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_score_threshold_automations_score_target_check | CHECK | `CHECK (score_target >= 0 AND score_target <= 100)` |  |  | sim |
| lead_score_threshold_automations_trigger_type_check | CHECK | `CHECK (trigger_type = ANY (ARRAY['grade_reached'::text, 'grade_dropped'::text, 'score_above'::text, 'score_below'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lead_score_threshold_log | lead_score_threshold_log_automation_id_fkey | automation_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lsta_user_active | btree | user_id, active | não | sim |  | `CREATE INDEX idx_lsta_user_active ON public.lead_score_threshold_automations USING btree (user_id, active)` |
| lead_score_threshold_automations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_threshold_automations_pkey ON public.lead_score_threshold_automations USING btree (id)` |


## Policies (RLS)

### `auto delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `auto insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `auto select own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `auto update own`

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
| trg_lsta_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| trg_lsta_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
