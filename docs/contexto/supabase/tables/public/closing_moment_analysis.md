# public.closing_moment_analysis

> Análise do melhor momento para fechamento

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
| usada por views | public.vw_best_closing_moments, public.vw_eq_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `recommended_timing` | `character varying(50)` | sim |  |  |  |
| 5 | `timing_score` | `integer` | sim |  |  |  |
| 6 | `emotional_readiness` | `integer` | sim |  |  |  |
| 7 | `engagement_level` | `integer` | sim |  |  |  |
| 8 | `buying_signals_count` | `integer` | sim |  |  |  |
| 9 | `objections_resolved_pct` | `numeric(5,2)` | sim |  |  |  |
| 10 | `positive_signals` | `jsonb` | sim |  |  |  |
| 11 | `warning_signals` | `jsonb` | sim |  |  |  |
| 12 | `risk_of_losing` | `character varying(20)` | sim |  |  |  |
| 13 | `risk_factors` | `text[]` | sim |  |  |  |
| 14 | `opportunity_window_start` | `timestamp with time zone` | sim |  |  |  |
| 15 | `opportunity_window_end` | `timestamp with time zone` | sim |  |  |  |
| 16 | `window_confidence` | `numeric(5,2)` | sim |  |  |  |
| 17 | `recommended_approach` | `text` | sim |  |  |  |
| 18 | `key_talking_points` | `text[]` | sim |  |  |  |
| 19 | `avoid_topics` | `text[]` | sim |  |  |  |
| 20 | `best_days` | `character varying(50)[]` | sim |  |  |  |
| 21 | `best_time_ranges` | `character varying(50)[]` | sim |  |  |  |
| 22 | `analyzed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 23 | `valid_until` | `timestamp with time zone` | sim | `(now() + '7 days'::interval)` |  |  |
| 24 | `is_current` | `boolean` | sim | `true` |  |  |
| 25 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 26 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| closing_moment_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| closing_moment_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| closing_moment_analysis_timing_score_check | CHECK | `CHECK (timing_score >= 0 AND timing_score <= 100)` |  |  | sim |
| closing_moment_analysis_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| closing_moment_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX closing_moment_analysis_pkey ON public.closing_moment_analysis USING btree (id)` |


## Policies (RLS)

### `closing_moment_analysis_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_closing_moment_analysis`

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
