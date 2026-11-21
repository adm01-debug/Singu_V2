# public.trigger_channel_effectiveness

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `channel` | `text` | não |  |  |  |
| 4 | `trigger_type` | `text` | não |  |  |  |
| 5 | `period_start` | `date` | não |  |  |  |
| 6 | `period_end` | `date` | não |  |  |  |
| 7 | `total_sent` | `integer` | sim | `0` |  |  |
| 8 | `total_opened` | `integer` | sim | `0` |  |  |
| 9 | `total_clicked` | `integer` | sim | `0` |  |  |
| 10 | `total_converted` | `integer` | sim | `0` |  |  |
| 11 | `avg_response_time_hours` | `numeric` | sim |  |  |  |
| 12 | `best_time_to_send` | `text` | sim |  |  |  |
| 13 | `best_day_to_send` | `text` | sim |  |  |  |
| 14 | `open_rate` | `numeric` | sim |  |  |  |
| 15 | `click_rate` | `numeric` | sim |  |  |  |
| 16 | `conversion_rate` | `numeric` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `contact_id` | `uuid` | sim |  |  |  |
| 20 | `uses` | `integer` | sim | `0` |  |  |
| 21 | `successes` | `integer` | sim | `0` |  |  |
| 22 | `effectiveness_score` | `numeric(5,2)` | sim | `0` |  |  |
| 23 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_channel_effectiveness_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_channel_effectiveness_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_channel_effectiveness_user_id_channel_trigger_type__key | UNIQUE | `UNIQUE (user_id, channel, trigger_type, period_start, period_end)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_channel_effectiveness_trigger_channel | btree | trigger_type, channel | não | sim |  | `CREATE INDEX idx_trigger_channel_effectiveness_trigger_channel ON public.trigger_channel_effectiveness USING btree (trigger_type, channel)` |
| idx_trigger_channel_effectiveness_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_trigger_channel_effectiveness_user_contact ON public.trigger_channel_effectiveness USING btree (user_id, contact_id)` |
| trigger_channel_effectiveness_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_channel_effectiveness_pkey ON public.trigger_channel_effectiveness USING btree (id)` |
| trigger_channel_effectiveness_user_id_channel_trigger_type__key | btree | user_id, channel, trigger_type, period_start, period_end | sim | sim |  | `CREATE UNIQUE INDEX trigger_channel_effectiveness_user_id_channel_trigger_type__key ON public.trigger_channel_effectiveness USING btree (user_id, channel, trigger_type, period_start, period_end)` |
| trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key | btree | user_id, contact_id, trigger_type, channel | sim | sim |  | `CREATE UNIQUE INDEX trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key ON public.trigger_channel_effectiveness USING btree (user_id, contact_id, trigger_type, channel)` |


## Policies (RLS)

### `Users can create their own channel effectiveness`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete their own channel effectiveness`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update their own channel effectiveness`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own channel effectiveness`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `trigger_channel_effectiveness_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_channel_effectiveness_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `trigger_channel_effectiveness_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `trigger_channel_effectiveness_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_trigger_channel_effectiveness | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
