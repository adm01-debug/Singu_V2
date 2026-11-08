# _dormant.social_profiles

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `platform` | `text` | não |  |  |  |
| 5 | `profile_url` | `text` | sim |  |  |  |
| 6 | `profile_data` | `jsonb` | sim |  |  |  |
| 7 | `headline` | `text` | sim |  |  |  |
| 8 | `current_company` | `text` | sim |  |  |  |
| 9 | `current_position` | `text` | sim |  |  |  |
| 10 | `location` | `text` | sim |  |  |  |
| 11 | `connections_count` | `integer` | sim |  |  |  |
| 12 | `followers_count` | `integer` | sim |  |  |  |
| 13 | `following_count` | `integer` | sim |  |  |  |
| 14 | `profile_image_url` | `text` | sim |  |  |  |
| 15 | `cover_image_url` | `text` | sim |  |  |  |
| 16 | `skills` | `text[]` | sim |  |  |  |
| 17 | `certifications` | `text[]` | sim |  |  |  |
| 18 | `education` | `jsonb` | sim |  |  |  |
| 19 | `experience` | `jsonb` | sim |  |  |  |
| 20 | `recent_posts` | `jsonb` | sim |  |  |  |
| 21 | `engagement_metrics` | `jsonb` | sim |  |  |  |
| 22 | `last_scraped_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| social_profiles_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| social_profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_social_profiles_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_social_profiles_contact ON _dormant.social_profiles USING btree (contact_id)` |
| social_profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX social_profiles_pkey ON _dormant.social_profiles USING btree (id)` |


## Policies (RLS)

### `Users can delete their own social profiles`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own social profiles`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own social profiles`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own social profiles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_social_profiles | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
