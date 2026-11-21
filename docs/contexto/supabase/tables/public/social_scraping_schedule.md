# public.social_scraping_schedule

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `platform` | `text` | não |  |  |  |
| 5 | `profile_url` | `text` | não |  |  |  |
| 6 | `frequency_days` | `integer` | sim | `7` |  |  |
| 7 | `priority` | `text` | sim | `'normal'::text` |  |  |
| 8 | `enabled` | `boolean` | sim | `true` |  |  |
| 9 | `last_run_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `next_run_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `consecutive_failures` | `integer` | sim | `0` |  |  |
| 12 | `last_error` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| social_scraping_schedule_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| social_scraping_schedule_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_social_scraping_schedule_next | btree | next_run_at | não | sim | `(enabled = true)` | `CREATE INDEX idx_social_scraping_schedule_next ON public.social_scraping_schedule USING btree (next_run_at) WHERE (enabled = true)` |
| idx_social_scraping_schedule_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_social_scraping_schedule_user_id ON public.social_scraping_schedule USING btree (user_id)` |
| social_scraping_schedule_contact_id_platform_key | btree | contact_id, platform | sim | sim |  | `CREATE UNIQUE INDEX social_scraping_schedule_contact_id_platform_key ON public.social_scraping_schedule USING btree (contact_id, platform)` |
| social_scraping_schedule_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX social_scraping_schedule_pkey ON public.social_scraping_schedule USING btree (id)` |


## Policies (RLS)

### `Users can delete their own scraping schedule`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own scraping schedule`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own scraping schedule`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own scraping schedule`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `social_scraping_schedule_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `social_scraping_schedule_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `social_scraping_schedule_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `social_scraping_schedule_update`

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
| set_updated_at_social_scraping_schedule | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
