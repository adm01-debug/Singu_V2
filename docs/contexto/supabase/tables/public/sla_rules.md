# public.sla_rules

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `entity_type` | `text` | não |  |  |  |
| 5 | `trigger_condition` | `jsonb` | não |  |  |  |
| 6 | `response_time_hours` | `integer` | não |  |  |  |
| 7 | `escalation_levels` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sla_rules_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['company'::text, 'deal'::text, 'interaction'::text, 'proposal'::text]))` |  |  | sim |
| sla_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.sla_violations | sla_violations_sla_rule_id_fkey | sla_rule_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sla_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sla_rules_pkey ON public.sla_rules USING btree (id)` |


## Policies (RLS)

### `sla_rules_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
