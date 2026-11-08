# _dormant.eq_analysis_history

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
| eq_analysis_history_confidence_check | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| eq_analysis_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| eq_analysis_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| eq_analysis_history_overall_score_check | CHECK | `CHECK (overall_score >= 0 AND overall_score <= 100)` |  |  | sim |
| eq_analysis_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| eq_analysis_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX eq_analysis_history_pkey ON _dormant.eq_analysis_history USING btree (id)` |
| idx_eq_analysis_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_eq_analysis_history_contact_id ON _dormant.eq_analysis_history USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own EQ analysis history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own EQ analysis history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own eq_analysis_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own EQ analysis history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
