# public.social_behavior_analysis

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
| 4 | `analysis_date` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `personality_traits` | `jsonb` | sim |  |  |  |
| 6 | `communication_style` | `jsonb` | sim |  |  |  |
| 7 | `interests` | `text[]` | sim |  |  |  |
| 8 | `topics` | `text[]` | sim |  |  |  |
| 9 | `overall_sentiment` | `text` | sim |  |  |  |
| 10 | `sentiment_score` | `numeric` | sim |  |  |  |
| 11 | `active_hours` | `jsonb` | sim |  |  |  |
| 12 | `active_days` | `text[]` | sim |  |  |  |
| 13 | `influence_level` | `text` | sim |  |  |  |
| 14 | `influence_score` | `numeric` | sim |  |  |  |
| 15 | `keywords` | `text[]` | sim |  |  |  |
| 16 | `hashtags` | `text[]` | sim |  |  |  |
| 17 | `valuable_connections` | `jsonb` | sim |  |  |  |
| 18 | `sales_insights` | `jsonb` | sim |  |  |  |
| 19 | `executive_summary` | `text` | sim |  |  |  |
| 20 | `confidence` | `numeric` | sim | `0.7` |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| social_behavior_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| social_behavior_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_social_behavior_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_social_behavior_analysis_contact ON public.social_behavior_analysis USING btree (contact_id)` |
| idx_social_behavior_analysis_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_social_behavior_analysis_user_id ON public.social_behavior_analysis USING btree (user_id)` |
| social_behavior_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX social_behavior_analysis_pkey ON public.social_behavior_analysis USING btree (id)` |


## Policies (RLS)

### `Users can delete their own social behavior analysis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own social behavior analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own social behavior analysis`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own social behavior analysis`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `social_behavior_analysis_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `social_behavior_analysis_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `social_behavior_analysis_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `social_behavior_analysis_update`

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
| trg_sync_social_insight | AFTER | INSERT OR UPDATE | ROW | enabled | public.sync_social_insight_from_analysis |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
