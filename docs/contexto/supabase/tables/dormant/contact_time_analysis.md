# _dormant.contact_time_analysis

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
| 4 | `day_of_week` | `integer` | não |  |  |  |
| 5 | `hour_of_day` | `integer` | não |  |  |  |
| 6 | `success_count` | `integer` | sim | `0` |  |  |
| 7 | `total_attempts` | `integer` | sim | `0` |  |  |
| 8 | `avg_response_time_minutes` | `integer` | sim |  |  |  |
| 9 | `last_updated` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_time_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_time_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key | UNIQUE | `UNIQUE (user_id, contact_id, day_of_week, hour_of_day)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_time_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_time_analysis_pkey ON _dormant.contact_time_analysis USING btree (id)` |
| contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key | btree | user_id, contact_id, day_of_week, hour_of_day | sim | sim |  | `CREATE UNIQUE INDEX contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key ON _dormant.contact_time_analysis USING btree (user_id, contact_id, day_of_week, hour_of_day)` |
| idx_contact_time_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_time_analysis_contact ON _dormant.contact_time_analysis USING btree (contact_id)` |


## Policies (RLS)

### `Users can delete their own contact time analysis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own contact time analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own contact time analysis`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own contact time analysis`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
