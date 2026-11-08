# public.handoff_requests

> SINGU: Fila de handoff SDR→Closer com qualificação BANT (Budget/Authority/Need/Timing), SLA de aceite de 4h (configurável) e tracking completo. Estados: pending → accepted/rejected/expired.

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `from_user_id` | `uuid` | não |  |  |  |
| 6 | `to_user_id` | `uuid` | sim |  |  |  |
| 7 | `status` | `text` | não | `'pending'::text` |  |  |
| 8 | `bant_budget` | `text` | sim |  |  |  |
| 9 | `bant_authority` | `text` | sim |  |  |  |
| 10 | `bant_need` | `text` | sim |  |  |  |
| 11 | `bant_timing` | `text` | sim |  |  |  |
| 12 | `bant_score` | `integer` | sim |  |  |  |
| 13 | `qualification_notes` | `text` | sim |  |  |  |
| 14 | `next_steps` | `text` | sim |  |  |  |
| 15 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 16 | `sla_deadline` | `timestamp with time zone` | não | `(now() + '04:00:00'::interval)` |  |  |
| 17 | `sla_breached` | `boolean` | sim | `false` |  |  |
| 18 | `accepted_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `rejected_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `rejection_reason` | `text` | sim |  |  |  |
| 21 | `expired_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `assignment_id` | `uuid` | sim |  |  |  |
| 23 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 24 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 26 | `from_member_id` | `uuid` | sim |  |  |  |
| 27 | `to_member_id` | `uuid` | sim |  |  |  |
| 28 | `qualification_data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 29 | `handoff_reason` | `text` | sim |  |  |  |
| 30 | `notes` | `text` | sim |  |  |  |
| 31 | `sla_hours` | `integer` | não | `4` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| handoff_requests_bant_score_check | CHECK | `CHECK (bant_score >= 0 AND bant_score <= 100)` |  |  | sim |
| handoff_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| handoff_requests_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))` |  |  | sim |
| handoff_requests_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'cancelled'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| handoff_requests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX handoff_requests_pkey ON public.handoff_requests USING btree (id)` |
| idx_handoff_created | btree | created_at | não | sim |  | `CREATE INDEX idx_handoff_created ON public.handoff_requests USING btree (created_at DESC)` |
| idx_handoff_from | btree | from_member_id | não | sim |  | `CREATE INDEX idx_handoff_from ON public.handoff_requests USING btree (from_member_id)` |
| idx_handoff_requests_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_handoff_requests_user_id ON public.handoff_requests USING btree (user_id)` |
| idx_handoff_status | btree | status | não | sim |  | `CREATE INDEX idx_handoff_status ON public.handoff_requests USING btree (status)` |
| idx_handoff_to | btree | to_member_id | não | sim |  | `CREATE INDEX idx_handoff_to ON public.handoff_requests USING btree (to_member_id)` |


## Policies (RLS)

### `Admins can view all handoff requests`

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

### `Users can delete their own handoff requests`

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

### `Users can insert their own handoff requests`

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

### `Users can update their own handoff requests`

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

### `Users can view their own handoff requests`

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
| update_handoff_requests_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
