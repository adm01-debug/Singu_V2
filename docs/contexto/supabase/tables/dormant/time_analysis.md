# _dormant.time_analysis

> SINGU: Análise de melhores horários para contato

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `day_of_week` | `integer` | não |  |  |  |
| 5 | `hour_of_day` | `integer` | não |  |  |  |
| 6 | `messages_sent` | `integer` | sim | `0` |  |  |
| 7 | `messages_received` | `integer` | sim | `0` |  |  |
| 8 | `responses_received` | `integer` | sim | `0` |  |  |
| 9 | `avg_response_time_minutes` | `integer` | sim |  |  |  |
| 10 | `response_rate` | `numeric(5,2)` | sim |  |  |  |
| 11 | `interaction_quality` | `numeric(3,2)` | sim |  |  |  |
| 12 | `analysis_start` | `date` | sim |  |  |  |
| 13 | `analysis_end` | `date` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| time_analysis_contact_id_day_of_week_hour_of_day_key | UNIQUE | `UNIQUE (contact_id, day_of_week, hour_of_day)` |  |  | sim |
| time_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| time_analysis_day_of_week_check | CHECK | `CHECK (day_of_week >= 0 AND day_of_week <= 6)` |  |  | sim |
| time_analysis_hour_of_day_check | CHECK | `CHECK (hour_of_day >= 0 AND hour_of_day <= 23)` |  |  | sim |
| time_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| time_analysis_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| time_analysis_contact_id_day_of_week_hour_of_day_key | btree | contact_id, day_of_week, hour_of_day | sim | sim |  | `CREATE UNIQUE INDEX time_analysis_contact_id_day_of_week_hour_of_day_key ON _dormant.time_analysis USING btree (contact_id, day_of_week, hour_of_day)` |
| time_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX time_analysis_pkey ON _dormant.time_analysis USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_time_analysis`

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
