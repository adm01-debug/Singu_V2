# _dormant.weekly_reports

> SINGU: Relatórios semanais de atividade e performance

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `week_start` | `date` | não |  |  |  |
| 4 | `week_end` | `date` | não |  |  |  |
| 5 | `interactions_count` | `integer` | sim | `0` |  |  |
| 6 | `new_contacts` | `integer` | sim | `0` |  |  |
| 7 | `messages_sent` | `integer` | sim | `0` |  |  |
| 8 | `calls_made` | `integer` | sim | `0` |  |  |
| 9 | `meetings_held` | `integer` | sim | `0` |  |  |
| 10 | `avg_sentiment_score` | `numeric(5,2)` | sim |  |  |  |
| 11 | `contacts_improved` | `integer` | sim | `0` |  |  |
| 12 | `contacts_declined` | `integer` | sim | `0` |  |  |
| 13 | `at_risk_contacts` | `integer` | sim | `0` |  |  |
| 14 | `deals_created` | `integer` | sim | `0` |  |  |
| 15 | `deals_won` | `integer` | sim | `0` |  |  |
| 16 | `deals_lost` | `integer` | sim | `0` |  |  |
| 17 | `revenue_closed` | `numeric(15,2)` | sim | `0` |  |  |
| 18 | `highlights` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 19 | `alerts_generated` | `integer` | sim | `0` |  |  |
| 20 | `alerts_resolved` | `integer` | sim | `0` |  |  |
| 21 | `next_week_priorities` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 22 | `comparison` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 23 | `status` | `text` | sim | `'generated'::text` |  |  |
| 24 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 25 | `viewed_at` | `timestamp with time zone` | sim |  |  |  |
| 26 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| weekly_reports_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| weekly_reports_status_check | CHECK | `CHECK (status = ANY (ARRAY['generating'::text, 'generated'::text, 'sent'::text, 'viewed'::text]))` |  |  | sim |
| weekly_reports_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_weekly_reports_unique | btree | user_id, week_start | sim | sim |  | `CREATE UNIQUE INDEX idx_weekly_reports_unique ON _dormant.weekly_reports USING btree (user_id, week_start)` |
| weekly_reports_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX weekly_reports_pkey ON _dormant.weekly_reports USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_weekly_reports`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
