# _dormant.insights

> SINGU: Insights gerados por análise de IA

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `interaction_id` | `uuid` | sim |  |  |  |
| 6 | `type` | `text` | não |  |  |  |
| 7 | `title` | `text` | não |  |  |  |
| 8 | `content` | `text` | não |  |  |  |
| 9 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 10 | `source` | `text` | sim |  |  |  |
| 11 | `data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `is_actionable` | `boolean` | sim | `false` |  |  |
| 13 | `action_taken` | `boolean` | sim | `false` |  |  |
| 14 | `action_taken_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `feedback` | `text` | sim |  |  |  |
| 16 | `feedback_note` | `text` | sim |  |  |  |
| 17 | `is_pinned` | `boolean` | sim | `false` |  |  |
| 18 | `is_archived` | `boolean` | sim | `false` |  |  |
| 19 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 20 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| insights_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| insights_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| insights_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| insights_feedback_check | CHECK | `CHECK (feedback = ANY (ARRAY['helpful'::text, 'not_helpful'::text, 'incorrect'::text]))` |  |  | sim |
| insights_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| insights_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| insights_type_check | CHECK | `CHECK (type = ANY (ARRAY['disc_analysis'::text, 'vak_analysis'::text, 'sentiment_analysis'::text, 'emotion_analysis'::text, 'communication_style'::text, 'relationship_health'::text, 'engagement_pattern'::text, 'best_contact_time'::text, 'trigger_suggestion'::text, 'objection_prediction'::text, 'upsell_suggestion'::text, 'churn_prediction'::text, 'summary'::text, 'key_points'::text, 'action_items'::text, 'custom'::text]))` |  |  | sim |
| insights_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| insights_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX insights_pkey ON _dormant.insights USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_insights`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
