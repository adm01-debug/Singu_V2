# public.relationship_score_history

> SINGU: Histórico de evolução do score de relacionamento

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
| usada por views | public.vw_closing_score_alerts, public.vw_closing_score_ranking |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `score` | `integer` | não |  |  |  |
| 5 | `engagement_score` | `integer` | sim |  |  |  |
| 6 | `sentiment_score` | `integer` | sim |  |  |  |
| 7 | `recency_score` | `integer` | sim |  |  |  |
| 8 | `frequency_score` | `integer` | sim |  |  |  |
| 9 | `depth_score` | `integer` | sim |  |  |  |
| 10 | `previous_score` | `integer` | sim |  |  |  |
| 11 | `score_change` | `integer` | sim |  |  |  |
| 12 | `stage` | `text` | sim |  |  |  |
| 13 | `previous_stage` | `text` | sim |  |  |  |
| 14 | `stage_changed` | `boolean` | sim | `false` |  |  |
| 15 | `trend` | `text` | sim |  |  |  |
| 16 | `change_reason` | `text` | sim |  |  |  |
| 17 | `measured_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| relationship_score_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| relationship_score_history_depth_score_check | CHECK | `CHECK (depth_score >= 0 AND depth_score <= 100)` |  |  | sim |
| relationship_score_history_engagement_score_check | CHECK | `CHECK (engagement_score >= 0 AND engagement_score <= 100)` |  |  | sim |
| relationship_score_history_frequency_score_check | CHECK | `CHECK (frequency_score >= 0 AND frequency_score <= 100)` |  |  | sim |
| relationship_score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| relationship_score_history_recency_score_check | CHECK | `CHECK (recency_score >= 0 AND recency_score <= 100)` |  |  | sim |
| relationship_score_history_score_check | CHECK | `CHECK (score >= 0 AND score <= 100)` |  |  | sim |
| relationship_score_history_sentiment_score_check | CHECK | `CHECK (sentiment_score >= 0 AND sentiment_score <= 100)` |  |  | sim |
| relationship_score_history_trend_check | CHECK | `CHECK (trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| relationship_score_history_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_relationship_score_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_relationship_score_history_contact_id ON public.relationship_score_history USING btree (contact_id)` |
| idx_relationship_score_history_contact_measured | btree | contact_id, measured_at | não | sim |  | `CREATE INDEX idx_relationship_score_history_contact_measured ON public.relationship_score_history USING btree (contact_id, measured_at DESC)` |
| idx_relationship_score_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_relationship_score_history_user_id ON public.relationship_score_history USING btree (user_id)` |
| relationship_score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX relationship_score_history_pkey ON public.relationship_score_history USING btree (id)` |


## Policies (RLS)

### `relationship_score_history_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `relationship_score_history_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `relationship_score_history_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `relationship_score_history_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
