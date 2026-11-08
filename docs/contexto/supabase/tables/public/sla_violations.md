# public.sla_violations

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
| 2 | `sla_rule_id` | `uuid` | sim |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `user_id` | `uuid` | não |  |  |  |
| 6 | `expected_at` | `timestamp with time zone` | não |  |  |  |
| 7 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `is_resolved` | `boolean` | sim | `false` |  |  |
| 9 | `escalation_level` | `integer` | sim | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sla_violations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sla_violations_sla_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (sla_rule_id) REFERENCES sla_rules(id)` | NO ACTION | NO ACTION | sim |
| sla_violations_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sla_violations_sla_rule_id | btree | sla_rule_id | não | sim |  | `CREATE INDEX idx_sla_violations_sla_rule_id ON public.sla_violations USING btree (sla_rule_id)` |
| idx_sla_violations_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sla_violations_user_id ON public.sla_violations USING btree (user_id)` |
| sla_violations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sla_violations_pkey ON public.sla_violations USING btree (id)` |


## Policies (RLS)

### `sla_violations_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `sla_violations_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `sla_violations_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `sla_violations_update`

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
