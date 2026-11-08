# _dormant.communication_cadence

> SINGU: Gestão de cadência de comunicação por contato

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `current_cadence` | `text` | sim |  |  |  |
| 5 | `ideal_cadence` | `text` | sim |  |  |  |
| 6 | `last_interaction_date` | `timestamp with time zone` | sim |  |  |  |
| 7 | `last_interaction_type` | `text` | sim |  |  |  |
| 8 | `next_suggested_date` | `date` | sim |  |  |  |
| 9 | `next_suggested_channel` | `text` | sim |  |  |  |
| 10 | `next_suggested_reason` | `text` | sim |  |  |  |
| 11 | `avg_response_time_hours` | `numeric(10,2)` | sim |  |  |  |
| 12 | `avg_days_between_contacts` | `numeric(10,2)` | sim |  |  |  |
| 13 | `engagement_trend` | `text` | sim |  |  |  |
| 14 | `is_overdue` | `boolean` | sim | `false` |  |  |
| 15 | `days_overdue` | `integer` | sim | `0` |  |  |
| 16 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| communication_cadence_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| communication_cadence_current_cadence_check | CHECK | `CHECK (current_cadence = ANY (ARRAY['daily'::text, 'every_2_days'::text, 'every_3_days'::text, 'weekly'::text, 'bi_weekly'::text, 'monthly'::text, 'quarterly'::text, 'inactive'::text]))` |  |  | sim |
| communication_cadence_engagement_trend_check | CHECK | `CHECK (engagement_trend = ANY (ARRAY['increasing'::text, 'stable'::text, 'decreasing'::text]))` |  |  | sim |
| communication_cadence_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| communication_cadence_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| communication_cadence_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX communication_cadence_pkey ON _dormant.communication_cadence USING btree (id)` |
| idx_cadence_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_cadence_unique ON _dormant.communication_cadence USING btree (contact_id)` |


## Policies (RLS)

### `dormant_deny_all_communication_cadence`

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
