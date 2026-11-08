# public.commission_rules

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
| 4 | `rule_type` | `text` | não |  |  |  |
| 5 | `base_percentage` | `numeric(5,2)` | sim | `0` |  |  |
| 6 | `tiers` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 7 | `applies_to` | `text` | sim | `'all'::text` |  |  |
| 8 | `min_deal_value` | `numeric(15,2)` | sim | `0` |  |  |
| 9 | `is_active` | `boolean` | sim | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| commission_rules_applies_to_check | CHECK | `CHECK (applies_to = ANY (ARRAY['all'::text, 'new_customers'::text, 'existing_customers'::text]))` |  |  | sim |
| commission_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| commission_rules_rule_type_check | CHECK | `CHECK (rule_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'tiered'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.commissions | commissions_rule_id_fkey | rule_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| commission_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX commission_rules_pkey ON public.commission_rules USING btree (id)` |


## Policies (RLS)

### `commission_rules_all`

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
