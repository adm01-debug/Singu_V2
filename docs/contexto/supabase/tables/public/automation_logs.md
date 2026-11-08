# public.automation_logs

> SINGU: Log de cada execução de regra de automação. Audit trail completo.

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
| usada por views | public.vw_singu_automation_dashboard, public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `rule_id` | `uuid` | não |  |  |  |
| 4 | `trigger_entity_type` | `text` | não |  |  |  |
| 5 | `trigger_entity_id` | `uuid` | não |  |  |  |
| 6 | `actions_executed` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `success` | `boolean` | não | `true` |  |  |
| 8 | `error_message` | `text` | sim |  |  |  |
| 9 | `executed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `automation_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| automation_logs_automation_id_fkey | FOREIGN KEY | `FOREIGN KEY (automation_id) REFERENCES automations(id)` | NO ACTION | NO ACTION | sim |
| automation_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| automation_logs_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (rule_id) REFERENCES automation_rules(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| automation_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX automation_logs_pkey ON public.automation_logs USING btree (id)` |
| idx_auto_logs_rule | btree | rule_id | não | sim |  | `CREATE INDEX idx_auto_logs_rule ON public.automation_logs USING btree (rule_id)` |
| idx_automation_logs_automation_id | btree | automation_id | não | sim |  | `CREATE INDEX idx_automation_logs_automation_id ON public.automation_logs USING btree (automation_id)` |
| idx_automation_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_automation_logs_user_id ON public.automation_logs USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own automation logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own automation logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can only update own automation logs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own automation logs`

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
