# public.contact_trigger_preferences

> SINGU: Preferências de gatilhos mentais aprendidas por contato

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `effective_triggers` | `text[]` | sim | `'{}'::text[]` |  |  |
| 5 | `avoid_triggers` | `text[]` | sim | `'{}'::text[]` |  |  |
| 6 | `preferred_intensity` | `integer` | sim | `3` |  |  |
| 7 | `urgency_responsive` | `boolean` | sim |  |  |  |
| 8 | `social_proof_responsive` | `boolean` | sim |  |  |  |
| 9 | `authority_responsive` | `boolean` | sim |  |  |  |
| 10 | `scarcity_responsive` | `boolean` | sim |  |  |  |
| 11 | `reciprocity_responsive` | `boolean` | sim |  |  |  |
| 12 | `notes` | `text` | sim |  |  |  |
| 13 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `interactions_analyzed` | `integer` | sim | `0` |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_trigger_preferences_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_trigger_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_trigger_preferences_preferred_intensity_check | CHECK | `CHECK (preferred_intensity >= 1 AND preferred_intensity <= 5)` |  |  | sim |
| contact_trigger_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_trigger_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_trigger_preferences_pkey ON public.contact_trigger_preferences USING btree (id)` |
| idx_trigger_prefs_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_trigger_prefs_unique ON public.contact_trigger_preferences USING btree (contact_id)` |


## Policies (RLS)

### `contact_trigger_preferences_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_contact_trigger_preferences`

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
