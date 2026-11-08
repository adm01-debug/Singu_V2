# _dormant.automation_logs

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
| 3 | `rule_id` | `uuid` | não |  |  |  |
| 4 | `trigger_entity_type` | `text` | não |  |  |  |
| 5 | `trigger_entity_id` | `uuid` | não |  |  |  |
| 6 | `actions_executed` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 7 | `success` | `boolean` | não | `true` |  |  |
| 8 | `error_message` | `text` | sim |  |  |  |
| 9 | `executed_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| automation_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| automation_logs_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (rule_id) REFERENCES _dormant.automation_rules(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| automation_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX automation_logs_pkey ON _dormant.automation_logs USING btree (id)` |


## Policies (RLS)

### `Users can create their own automation logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own automation logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can only update own automation logs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

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
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
