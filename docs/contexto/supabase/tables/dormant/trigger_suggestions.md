# _dormant.trigger_suggestions

> SINGU: Sugestões de gatilhos mentais geradas por IA

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
| 4 | `trigger_code` | `text` | não |  |  |  |
| 5 | `bundle_code` | `text` | sim |  |  |  |
| 6 | `context` | `text` | sim |  |  |  |
| 7 | `reason` | `text` | não |  |  |  |
| 8 | `reason_pt` | `text` | sim |  |  |  |
| 9 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 10 | `suggested_message` | `text` | sim |  |  |  |
| 11 | `suggested_message_pt` | `text` | sim |  |  |  |
| 12 | `status` | `text` | sim | `'pending'::text` |  |  |
| 13 | `feedback_helpful` | `boolean` | sim |  |  |  |
| 14 | `feedback_note` | `text` | sim |  |  |  |
| 15 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `used_in_interaction_id` | `uuid` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_suggestions_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| trigger_suggestions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_suggestions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'used'::text, 'expired'::text]))` |  |  | sim |
| trigger_suggestions_used_in_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (used_in_interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| trigger_suggestions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| trigger_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_suggestions_pkey ON _dormant.trigger_suggestions USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_trigger_suggestions`

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
