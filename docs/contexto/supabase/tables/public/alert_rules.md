# public.alert_rules

> Regras configuráveis de alerta

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `rule_name` | `character varying(255)` | não |  |  |  |
| 3 | `rule_code` | `character varying(50)` | sim |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `applies_to` | `character varying(50)` | sim |  |  |  |
| 6 | `user_ids` | `uuid[]` | sim |  |  |  |
| 7 | `role_ids` | `uuid[]` | sim |  |  |  |
| 8 | `trigger_entity` | `character varying(50)` | sim |  |  |  |
| 9 | `trigger_condition` | `jsonb` | não |  |  |  |
| 10 | `action_type` | `character varying(50)` | sim |  |  |  |
| 11 | `action_config` | `jsonb` | sim |  |  |  |
| 12 | `check_frequency` | `character varying(20)` | sim | `'daily'::character varying` |  |  |
| 13 | `last_checked_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `cooldown_hours` | `integer` | sim | `24` |  |  |
| 15 | `is_active` | `boolean` | sim | `true` |  |  |
| 16 | `created_by` | `uuid` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alert_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| alert_rules_rule_code_key | UNIQUE | `UNIQUE (rule_code)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.alert_log | alert_log_rule_id_fkey | rule_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alert_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alert_rules_pkey ON public.alert_rules USING btree (id)` |
| alert_rules_rule_code_key | btree | rule_code | sim | sim |  | `CREATE UNIQUE INDEX alert_rules_rule_code_key ON public.alert_rules USING btree (rule_code)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
