# public.lead_assignments

> SINGU: Histórico completo de atribuições de leads. Cada atribuição (automática via regra, manual, ou handoff SDR→Closer) gera um registro com SLA tracking, status e motivo de rejeição se aplicável. Append-only via convenção.

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `assigned_to` | `uuid` | não |  |  |  |
| 6 | `assigned_by` | `uuid` | sim |  |  |  |
| 7 | `assigned_by_rule_id` | `uuid` | sim |  |  |  |
| 8 | `previous_owner` | `uuid` | sim |  |  |  |
| 9 | `assignment_type` | `text` | não | `'automatic'::text` |  |  |
| 10 | `status` | `text` | não | `'active'::text` |  |  |
| 11 | `sla_deadline` | `timestamp with time zone` | sim |  |  |  |
| 12 | `sla_status` | `text` | sim | `'within'::text` |  |  |
| 13 | `accepted_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `rejected_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `rejection_reason` | `text` | sim |  |  |  |
| 17 | `notes` | `text` | sim |  |  |  |
| 18 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `routing_rule_id` | `uuid` | sim |  |  |  |
| 22 | `first_contact_at` | `timestamp with time zone` | sim |  |  |  |
| 23 | `sla_met` | `boolean` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_assignments_assignment_type_check | CHECK | `CHECK (assignment_type = ANY (ARRAY['automatic'::text, 'manual'::text, 'handoff'::text, 'redistribution'::text, 'reassignment'::text]))` |  |  | sim |
| lead_assignments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_assignments_previous_owner_fkey | FOREIGN KEY | `FOREIGN KEY (previous_owner) REFERENCES sales_team_members(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lead_assignments_routing_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (routing_rule_id) REFERENCES lead_routing_rules(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| lead_assignments_sla_status_check | CHECK | `CHECK (sla_status = ANY (ARRAY['within'::text, 'warning'::text, 'breached'::text, 'na'::text]))` |  |  | sim |
| lead_assignments_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'completed'::text, 'reassigned'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_assignments_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_assignments_contact ON public.lead_assignments USING btree (contact_id)` |
| idx_assignments_created | btree | created_at | não | sim |  | `CREATE INDEX idx_assignments_created ON public.lead_assignments USING btree (created_at DESC)` |
| idx_assignments_status | btree | status | não | sim |  | `CREATE INDEX idx_assignments_status ON public.lead_assignments USING btree (status)` |
| idx_assignments_type | btree | assignment_type | não | sim |  | `CREATE INDEX idx_assignments_type ON public.lead_assignments USING btree (assignment_type)` |
| idx_lead_assignments_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_lead_assignments_user_id ON public.lead_assignments USING btree (user_id)` |
| lead_assignments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_assignments_pkey ON public.lead_assignments USING btree (id)` |


## Policies (RLS)

### `Admins can view all assignments`

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

### `Users can delete their own assignments`

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

### `Users can insert their own assignments`

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

### `Users can update their own assignments`

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

### `Users can view their own assignments`

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
| update_lead_assignments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
