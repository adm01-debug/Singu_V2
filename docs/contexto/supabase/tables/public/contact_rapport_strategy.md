# public.contact_rapport_strategy

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
| 3 | `visual_preference_score` | `integer` | sim |  |  |  |
| 4 | `auditory_preference_score` | `integer` | sim |  |  |  |
| 5 | `kinesthetic_preference_score` | `integer` | sim |  |  |  |
| 6 | `digital_preference_score` | `integer` | sim |  |  |  |
| 7 | `emotional_anchors` | `text[]` | sim |  |  |  |
| 8 | `resistance_triggers` | `text[]` | sim |  |  |  |
| 9 | `pacing_speed` | `text` | sim |  |  |  |
| 10 | `voice_tone_preferred` | `text` | sim |  |  |  |
| 11 | `mirroring_technique` | `text` | sim |  |  |  |
| 12 | `preferred_triggers` | `text[]` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_rapport_strategy_auditory_preference_score_check | CHECK | `CHECK (auditory_preference_score >= 0 AND auditory_preference_score <= 100)` |  |  | sim |
| contact_rapport_strategy_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_rapport_strategy_digital_preference_score_check | CHECK | `CHECK (digital_preference_score >= 0 AND digital_preference_score <= 100)` |  |  | sim |
| contact_rapport_strategy_kinesthetic_preference_score_check | CHECK | `CHECK (kinesthetic_preference_score >= 0 AND kinesthetic_preference_score <= 100)` |  |  | sim |
| contact_rapport_strategy_pacing_speed_check | CHECK | `CHECK (pacing_speed = ANY (ARRAY['slow'::text, 'medium'::text, 'fast'::text]))` |  |  | sim |
| contact_rapport_strategy_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_rapport_strategy_visual_preference_score_check | CHECK | `CHECK (visual_preference_score >= 0 AND visual_preference_score <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_rapport_strategy_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_rapport_strategy_contact_id_key ON public.contact_rapport_strategy USING btree (contact_id)` |
| contact_rapport_strategy_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_rapport_strategy_pkey ON public.contact_rapport_strategy USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete contact_rapport_strategy`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can insert contact_rapport_strategy`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can select contact_rapport_strategy`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update contact_rapport_strategy`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| log_contact_rapport_change | AFTER | UPDATE | ROW | enabled | public.log_behavioral_change |
| update_contact_rapport_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
