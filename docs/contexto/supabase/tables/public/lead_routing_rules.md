# public.lead_routing_rules

> SINGU: Regras configuráveis de roteamento de leads (round-robin, ponderado, por território/indústria/fonte). Prioridade define ordem de avaliação. role_filter e team_pool definem o universo elegível.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 9 |
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
| 5 | `rule_type` | `text` | não |  |  |  |
| 6 | `priority` | `integer` | não | `100` |  |  |
| 7 | `is_active` | `boolean` | sim | `true` |  |  |
| 8 | `role_filter` | `text[]` | sim | `'{sdr}'::text[]` |  |  |
| 9 | `team_pool` | `uuid[]` | sim | `'{}'::uuid[]` |  |  |
| 10 | `conditions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `match_count` | `integer` | sim | `0` |  |  |
| 12 | `assignment_count` | `integer` | sim | `0` |  |  |
| 13 | `last_matched_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `fallback_rule_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_routing_rules_fallback_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (fallback_rule_id) REFERENCES lead_routing_rules(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lead_routing_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_routing_rules_rule_type_check | CHECK | `CHECK (rule_type = ANY (ARRAY['round_robin'::text, 'weighted'::text, 'territory'::text, 'industry'::text, 'source'::text, 'custom'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.lead_assignments | lead_assignments_routing_rule_id_fkey | routing_rule_id | SET NULL |
| public.lead_routing_rules | lead_routing_rules_fallback_rule_id_fkey | fallback_rule_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lead_routing_rules_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_lead_routing_rules_user_id ON public.lead_routing_rules USING btree (user_id)` |
| idx_routing_rules_active | btree | is_active | não | sim |  | `CREATE INDEX idx_routing_rules_active ON public.lead_routing_rules USING btree (is_active)` |
| idx_routing_rules_priority | btree | priority | não | sim |  | `CREATE INDEX idx_routing_rules_priority ON public.lead_routing_rules USING btree (priority)` |
| lead_routing_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_routing_rules_pkey ON public.lead_routing_rules USING btree (id)` |


## Policies (RLS)

### `Admins can view all routing rules`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own routing rules`

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

### `Users can insert their own routing rules`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own routing rules`

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

### `Users can view their own routing rules`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_lead_routing_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
