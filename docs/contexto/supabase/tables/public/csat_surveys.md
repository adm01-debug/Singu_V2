# public.csat_surveys

> SINGU: Pesquisas de satisfação (CSAT 1-5, NPS 0-10, CES 1-7). Vinculadas opcionalmente a ticket/contact/company.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `ticket_id` | `uuid` | sim |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `company_id` | `uuid` | sim |  |  |  |
| 6 | `score` | `integer` | sim |  |  |  |
| 7 | `nps_score` | `integer` | sim |  |  |  |
| 8 | `ces_score` | `integer` | sim |  |  |  |
| 9 | `feedback` | `text` | sim |  |  |  |
| 10 | `channel` | `text` | sim |  |  |  |
| 11 | `survey_type` | `text` | não | `'csat'::text` |  |  |
| 12 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `responded_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `interaction_id` | `uuid` | sim |  |  |  |
| 17 | `status` | `text` | não | `'pending'::text` |  |  |
| 18 | `answered_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `expires_at` | `timestamp with time zone` | sim | `(now() + '7 days'::interval)` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `public_token` | `uuid` | não | `gen_random_uuid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_csat_surveys_status | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'answered'::text, 'expired'::text]))` |  |  | sim |
| csat_surveys_answered_score_check | CHECK | `CHECK (status <> 'answered'::text OR CASE survey_type     WHEN 'csat'::text THEN score IS NOT NULL     WHEN 'nps'::text THEN nps_score IS NOT NULL     WHEN 'ces'::text THEN ces_score IS NOT NULL     WHEN 'custom'::text THEN true     ELSE false END)` |  |  | sim |
| csat_surveys_ces_contract_check | CHECK | `CHECK (ces_score >= 1 AND ces_score <= 7)` |  |  | sim |
| csat_surveys_ces_score_check | CHECK | `CHECK (ces_score >= 1 AND ces_score <= 7)` |  |  | sim |
| csat_surveys_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| csat_surveys_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| csat_surveys_nps_contract_check | CHECK | `CHECK (nps_score >= 0 AND nps_score <= 10)` |  |  | sim |
| csat_surveys_nps_score_check | CHECK | `CHECK (nps_score >= 0 AND nps_score <= 10)` |  |  | sim |
| csat_surveys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| csat_surveys_score_check | CHECK | `CHECK (score >= 1 AND score <= 5)` |  |  | sim |
| csat_surveys_survey_type_check | CHECK | `CHECK (survey_type = ANY (ARRAY['csat'::text, 'nps'::text, 'ces'::text, 'custom'::text]))` |  |  | sim |
| csat_surveys_ticket_id_fkey | FOREIGN KEY | `FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| csat_surveys_type_contract_check | CHECK | `CHECK (survey_type = ANY (ARRAY['csat'::text, 'nps'::text, 'ces'::text, 'custom'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| csat_surveys_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX csat_surveys_pkey ON public.csat_surveys USING btree (id)` |
| csat_surveys_public_token_key | btree | public_token | sim | sim |  | `CREATE UNIQUE INDEX csat_surveys_public_token_key ON public.csat_surveys USING btree (public_token)` |
| idx_csat_surveys_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_csat_surveys_user_id ON public.csat_surveys USING btree (user_id)` |


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

### `Users manage own csat surveys`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `csat_surveys_owner`

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
| trg_csat_surveys_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
