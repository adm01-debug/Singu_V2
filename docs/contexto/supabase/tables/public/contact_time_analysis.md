# public.contact_time_analysis

> SINGU: Heatmap de melhores horários/dias para contatar cada lead. Grid 7x24.

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
| usada por views | public.vw_singu_communication_intel, public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `day_of_week` | `integer` | não |  |  |  |
| 5 | `hour_of_day` | `integer` | não |  |  |  |
| 6 | `total_attempts` | `integer` | sim | `0` |  |  |
| 7 | `success_count` | `integer` | sim | `0` |  |  |
| 8 | `avg_response_time_minutes` | `integer` | sim |  |  |  |
| 9 | `last_updated` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_day_of_week | CHECK | `CHECK (day_of_week >= 0 AND day_of_week <= 6)` |  |  | sim |
| chk_hour_of_day | CHECK | `CHECK (hour_of_day >= 0 AND hour_of_day <= 23)` |  |  | sim |
| contact_time_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_time_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_time_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_time_analysis_pkey ON public.contact_time_analysis USING btree (id)` |
| contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key | btree | user_id, contact_id, day_of_week, hour_of_day | sim | sim |  | `CREATE UNIQUE INDEX contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key ON public.contact_time_analysis USING btree (user_id, contact_id, day_of_week, hour_of_day)` |
| idx_contact_time_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_contact_time_analysis_contact ON public.contact_time_analysis USING btree (contact_id)` |
| idx_time_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_time_analysis_contact ON public.contact_time_analysis USING btree (contact_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own contact time analysis`

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

### `Users can insert their own contact time analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own contact time analysis`

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

### `Users can view their own contact time analysis`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| on_contact_time_analysis_change | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_contact_time_analysis_audit |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
