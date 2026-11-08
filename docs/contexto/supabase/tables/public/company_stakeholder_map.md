# public.company_stakeholder_map

> SINGU: Mapa de stakeholders por empresa (poder/interesse)

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
| 3 | `company_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | não |  |  |  |
| 5 | `buying_role` | `text` | sim |  |  |  |
| 6 | `power_level` | `integer` | sim | `5` |  |  |
| 7 | `interest_level` | `integer` | sim | `5` |  |  |
| 8 | `stance` | `text` | sim |  |  |  |
| 9 | `access_level` | `text` | sim |  |  |  |
| 10 | `access_via_contact_id` | `uuid` | sim |  |  |  |
| 11 | `engagement_priority` | `text` | sim |  |  |  |
| 12 | `engagement_strategy` | `text` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_stakeholder_map_access_level_check | CHECK | `CHECK (access_level = ANY (ARRAY['direct'::text, 'indirect'::text, 'no_access'::text, 'pending'::text]))` |  |  | sim |
| company_stakeholder_map_access_via_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (access_via_contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| company_stakeholder_map_buying_role_check | CHECK | `CHECK (buying_role = ANY (ARRAY['economic_buyer'::text, 'technical_buyer'::text, 'user_buyer'::text, 'coach'::text, 'gatekeeper'::text, 'influencer'::text, 'blocker'::text, 'champion'::text, 'unknown'::text]))` |  |  | sim |
| company_stakeholder_map_company_id_contact_id_key | UNIQUE | `UNIQUE (company_id, contact_id)` |  |  | sim |
| company_stakeholder_map_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_stakeholder_map_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_stakeholder_map_engagement_priority_check | CHECK | `CHECK (engagement_priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text, 'monitor'::text]))` |  |  | sim |
| company_stakeholder_map_interest_level_check | CHECK | `CHECK (interest_level >= 0 AND interest_level <= 10)` |  |  | sim |
| company_stakeholder_map_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| company_stakeholder_map_power_level_check | CHECK | `CHECK (power_level >= 0 AND power_level <= 10)` |  |  | sim |
| company_stakeholder_map_stance_check | CHECK | `CHECK (stance = ANY (ARRAY['strong_advocate'::text, 'advocate'::text, 'neutral'::text, 'skeptic'::text, 'blocker'::text]))` |  |  | sim |
| company_stakeholder_map_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_stakeholder_map_company_id_contact_id_key | btree | company_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX company_stakeholder_map_company_id_contact_id_key ON public.company_stakeholder_map USING btree (company_id, contact_id)` |
| company_stakeholder_map_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_stakeholder_map_pkey ON public.company_stakeholder_map USING btree (id)` |
| idx_company_stakeholder_map_access_via_contact_id | btree | access_via_contact_id | não | sim |  | `CREATE INDEX idx_company_stakeholder_map_access_via_contact_id ON public.company_stakeholder_map USING btree (access_via_contact_id)` |
| idx_company_stakeholder_map_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_company_stakeholder_map_company_id ON public.company_stakeholder_map USING btree (company_id)` |
| idx_company_stakeholder_map_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_company_stakeholder_map_contact_id ON public.company_stakeholder_map USING btree (contact_id)` |
| idx_company_stakeholder_map_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_company_stakeholder_map_user_id ON public.company_stakeholder_map USING btree (user_id)` |


## Policies (RLS)

### `company_stakeholder_map_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `company_stakeholder_map_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `company_stakeholder_map_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `company_stakeholder_map_update`

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
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
