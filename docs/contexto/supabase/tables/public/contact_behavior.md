# public.contact_behavior

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `disc_primary` | `text` | sim |  |  |  |
| 4 | `disc_confidence` | `integer` | sim |  |  |  |
| 5 | `disc_notes` | `text` | sim |  |  |  |
| 6 | `vak_primary` | `text` | sim |  |  |  |
| 7 | `motivation_primary` | `text` | sim |  |  |  |
| 8 | `main_fear` | `text` | sim |  |  |  |
| 9 | `career_stage` | `text` | sim |  |  |  |
| 10 | `current_pressure` | `text` | sim |  |  |  |
| 11 | `professional_goals` | `text` | sim |  |  |  |
| 12 | `preferred_channel` | `text` | sim |  |  |  |
| 13 | `message_style` | `text` | sim |  |  |  |
| 14 | `response_time_avg` | `interval` | sim |  |  |  |
| 15 | `best_contact_window` | `text` | sim |  |  |  |
| 16 | `formality_level` | `integer` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `vak_visual` | `integer` | sim | `0` |  |  |
| 20 | `vak_auditory` | `integer` | sim | `0` |  |  |
| 21 | `vak_kinesthetic` | `integer` | sim | `0` |  |  |
| 22 | `decision_speed` | `text` | sim |  |  |  |
| 23 | `decision_criteria` | `text[]` | sim |  |  |  |
| 24 | `needs_approval` | `boolean` | sim | `false` |  |  |
| 25 | `approver_id` | `uuid` | sim |  |  |  |
| 26 | `budget_authority` | `boolean` | sim | `false` |  |  |
| 27 | `decision_role` | `text` | sim |  |  |  |
| 28 | `decision_power` | `integer` | sim |  |  |  |
| 29 | `support_level` | `integer` | sim |  |  |  |
| 30 | `influencer_ids` | `uuid[]` | sim |  |  |  |
| 31 | `company_financial_health` | `text` | sim |  |  |  |
| 32 | `current_challenges` | `text[]` | sim |  |  |  |
| 33 | `current_competitors` | `text[]` | sim |  |  |  |
| 34 | `best_time_to_approach` | `text` | sim |  |  |  |
| 35 | `seasonal_notes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_behavior_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_behavior_decision_power_check | CHECK | `CHECK (decision_power >= 1 AND decision_power <= 10)` |  |  | sim |
| contact_behavior_disc_confidence_check | CHECK | `CHECK (disc_confidence >= 0 AND disc_confidence <= 100)` |  |  | sim |
| contact_behavior_disc_primary_check | CHECK | `CHECK (disc_primary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| contact_behavior_formality_level_check | CHECK | `CHECK (formality_level >= 1 AND formality_level <= 5)` |  |  | sim |
| contact_behavior_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_behavior_support_level_check | CHECK | `CHECK (support_level >= 1 AND support_level <= 10)` |  |  | sim |
| contact_behavior_vak_primary_check | CHECK | `CHECK (vak_primary = ANY (ARRAY['visual'::text, 'auditivo'::text, 'cinestesico'::text]))` |  |  | sim |
| disc_confidence_range | CHECK | `CHECK (disc_confidence >= 0 AND disc_confidence <= 100)` |  |  | sim |
| formality_level_range | CHECK | `CHECK (formality_level >= 1 AND formality_level <= 5)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_behavior_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_behavior_contact_id_key ON public.contact_behavior USING btree (contact_id)` |
| contact_behavior_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_behavior_pkey ON public.contact_behavior USING btree (id)` |
| idx_contact_behavior_approver_id | btree | approver_id | não | sim |  | `CREATE INDEX idx_contact_behavior_approver_id ON public.contact_behavior USING btree (approver_id)` |
| idx_contact_behavior_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_behavior_contact_id ON public.contact_behavior USING btree (contact_id)` |


## Policies (RLS)

### `Owner or admin can delete contact_behavior`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can insert contact_behavior`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can select contact_behavior`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update contact_behavior`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| log_contact_behavior_change | AFTER | UPDATE | ROW | enabled | public.log_behavioral_change |
| update_contact_behavior_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
