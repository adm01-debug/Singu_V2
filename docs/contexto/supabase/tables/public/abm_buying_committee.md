# public.abm_buying_committee

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
| 2 | `account_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `external_contact_id` | `text` | sim |  |  |  |
| 5 | `contact_name` | `text` | não |  |  |  |
| 6 | `contact_email` | `text` | sim |  |  |  |
| 7 | `contact_role` | `text` | sim |  |  |  |
| 8 | `committee_role` | `text` | não |  |  |  |
| 9 | `influence_level` | `integer` | não | `5` |  |  |
| 10 | `engagement_score` | `integer` | não | `0` |  |  |
| 11 | `notes` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| abm_buying_committee_committee_role_check | CHECK | `CHECK (committee_role = ANY (ARRAY['decision_maker'::text, 'influencer'::text, 'champion'::text, 'blocker'::text, 'user'::text, 'technical'::text, 'economic'::text]))` |  |  | sim |
| abm_buying_committee_engagement_score_check | CHECK | `CHECK (engagement_score >= 0 AND engagement_score <= 100)` |  |  | sim |
| abm_buying_committee_influence_level_check | CHECK | `CHECK (influence_level >= 1 AND influence_level <= 10)` |  |  | sim |
| abm_buying_committee_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| abm_buying_committee_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX abm_buying_committee_pkey ON public.abm_buying_committee USING btree (id)` |
| idx_abm_committee_account | btree | account_id | não | sim |  | `CREATE INDEX idx_abm_committee_account ON public.abm_buying_committee USING btree (account_id)` |
| idx_abm_committee_user | btree | user_id | não | sim |  | `CREATE INDEX idx_abm_committee_user ON public.abm_buying_committee USING btree (user_id)` |


## Policies (RLS)

### `abm_committee_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_committee_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `abm_committee_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `abm_committee_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| abm_committee_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
