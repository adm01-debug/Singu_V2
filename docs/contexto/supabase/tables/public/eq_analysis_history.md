# public.eq_analysis_history

> SINGU: Histórico de análises de Inteligência Emocional (EQ). 5 pilares: self_awareness, self_regulation, motivation, empathy, social_skills.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_singu_contact_360, public.vw_singu_readiness, public.vw_singu_usage_kpis, zapp_history.v_contact_360 |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `overall_score` | `integer` | não |  |  |  |
| 6 | `overall_level` | `text` | não |  |  |  |
| 7 | `confidence` | `integer` | sim |  |  |  |
| 8 | `pillar_scores` | `jsonb` | não |  |  |  |
| 9 | `indicators` | `jsonb` | sim |  |  |  |
| 10 | `strengths` | `text[]` | sim |  |  |  |
| 11 | `areas_for_growth` | `text[]` | sim |  |  |  |
| 12 | `sales_implications` | `jsonb` | sim |  |  |  |
| 13 | `communication_style` | `jsonb` | sim |  |  |  |
| 14 | `profile_summary` | `text` | sim |  |  |  |
| 15 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_eq_level | CHECK | `CHECK (overall_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'very_high'::text]))` |  |  | sim |
| chk_eq_score | CHECK | `CHECK (overall_score >= 0 AND overall_score <= 100)` |  |  | sim |
| eq_analysis_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| eq_analysis_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| eq_analysis_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| eq_analysis_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX eq_analysis_history_pkey ON public.eq_analysis_history USING btree (id)` |
| idx_eq_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_eq_analysis_contact ON public.eq_analysis_history USING btree (contact_id)` |
| idx_eq_analysis_history_analyzed_at | btree | analyzed_at | não | sim |  | `CREATE INDEX idx_eq_analysis_history_analyzed_at ON public.eq_analysis_history USING btree (analyzed_at DESC)` |
| idx_eq_analysis_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_eq_analysis_history_contact_id ON public.eq_analysis_history USING btree (contact_id)` |
| idx_eq_analysis_history_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_eq_analysis_history_interaction_id ON public.eq_analysis_history USING btree (interaction_id)` |
| idx_eq_analysis_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_eq_analysis_history_user_id ON public.eq_analysis_history USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own EQ analysis history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own EQ analysis history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
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
| WITH CHECK |  |

### `Users can update their own eq_analysis_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own EQ analysis history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
