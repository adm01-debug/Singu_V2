# public.support_tickets

> SINGU: Tickets de suporte com SLA automático por prioridade, canal multi (email/whatsapp/phone/chat), categorização e CSAT integrado. ticket_number sequential.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `ticket_number` | `bigint` | não | `nextval('support_tickets_ticket_number_seq'::regclass)` |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `company_id` | `uuid` | sim |  |  |  |
| 6 | `subject` | `text` | não |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `category` | `text` | sim |  |  |  |
| 9 | `priority` | `text` | não | `'medium'::text` |  |  |
| 10 | `status` | `text` | não | `'open'::text` |  |  |
| 11 | `assigned_to` | `uuid` | sim |  |  |  |
| 12 | `channel` | `text` | sim |  |  |  |
| 13 | `sla_first_response_deadline` | `timestamp with time zone` | sim |  |  |  |
| 14 | `sla_resolution_deadline` | `timestamp with time zone` | sim |  |  |  |
| 15 | `sla_first_response_breached` | `boolean` | sim | `false` |  |  |
| 16 | `sla_resolution_breached` | `boolean` | sim | `false` |  |  |
| 17 | `first_response_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `closed_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `csat_sent` | `boolean` | sim | `false` |  |  |
| 21 | `csat_score` | `integer` | sim |  |  |  |
| 22 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |
| 23 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 24 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 26 | `title` | `text` | sim |  |  |  |
| 27 | `sla_deadline` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| support_tickets_assigned_to_fkey | FOREIGN KEY | `FOREIGN KEY (assigned_to) REFERENCES sales_team_members(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| support_tickets_category_check | CHECK | `CHECK (category = ANY (ARRAY['bug'::text, 'question'::text, 'request'::text, 'complaint'::text, 'feedback'::text, 'billing'::text, 'other'::text]))` |  |  | sim |
| support_tickets_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['email'::text, 'whatsapp'::text, 'phone'::text, 'chat'::text, 'form'::text, 'portal'::text, 'api'::text]))` |  |  | sim |
| support_tickets_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| support_tickets_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| support_tickets_csat_score_check | CHECK | `CHECK (csat_score >= 1 AND csat_score <= 5)` |  |  | sim |
| support_tickets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| support_tickets_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text, 'critical'::text]))` |  |  | sim |
| support_tickets_status_check | CHECK | `CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'waiting_customer'::text, 'waiting_internal'::text, 'resolved'::text, 'closed'::text, 'cancelled'::text]))` |  |  | sim |
| support_tickets_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.csat_surveys | csat_surveys_ticket_id_fkey | ticket_id | SET NULL |
| public.ticket_comments | ticket_comments_ticket_id_fkey | ticket_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_support_tickets_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id)` |
| support_tickets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id)` |


## Policies (RLS)

### `Users can delete own`

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

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users manage own tickets`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_support_tickets_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
