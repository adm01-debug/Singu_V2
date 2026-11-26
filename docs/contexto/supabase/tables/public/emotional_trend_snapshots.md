# public.emotional_trend_snapshots

> Snapshots periódicos de tendência emocional

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_emotional_trend_by_contact, public.vw_eq_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `period_start` | `timestamp with time zone` | não |  |  |  |
| 5 | `period_end` | `timestamp with time zone` | não |  |  |  |
| 6 | `period_type` | `character varying(20)` | sim | `'weekly'::character varying` |  |  |
| 7 | `avg_sentiment_score` | `numeric(5,2)` | sim |  |  |  |
| 8 | `sentiment_variance` | `numeric(5,2)` | sim |  |  |  |
| 9 | `dominant_emotion` | `character varying(50)` | sim |  |  |  |
| 10 | `emotion_distribution` | `jsonb` | sim |  |  |  |
| 11 | `trend_direction` | `character varying(20)` | sim |  |  |  |
| 12 | `trend_strength` | `numeric(5,2)` | sim |  |  |  |
| 13 | `total_interactions` | `integer` | sim |  |  |  |
| 14 | `positive_interactions` | `integer` | sim |  |  |  |
| 15 | `neutral_interactions` | `integer` | sim |  |  |  |
| 16 | `negative_interactions` | `integer` | sim |  |  |  |
| 17 | `patterns_identified` | `text[]` | sim |  |  |  |
| 18 | `triggers_positive` | `text[]` | sim |  |  |  |
| 19 | `triggers_negative` | `text[]` | sim |  |  |  |
| 20 | `recommended_actions` | `text[]` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| emotional_trend_snapshots_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| emotional_trend_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| emotional_trend_snapshots_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| emotional_trend_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX emotional_trend_snapshots_pkey ON public.emotional_trend_snapshots USING btree (id)` |


## Policies (RLS)

### `emotional_trend_snapshots_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_emotional_trend_snapshots`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_owner_from_contact | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_owner_from_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
