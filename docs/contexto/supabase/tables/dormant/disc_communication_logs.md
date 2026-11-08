# _dormant.disc_communication_logs

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
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `contact_disc_profile` | `text` | não |  |  |  |
| 6 | `approach_adapted` | `boolean` | não | `false` |  |  |
| 7 | `adaptation_tips_shown` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `tips_followed` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 9 | `communication_outcome` | `text` | sim |  |  |  |
| 10 | `outcome_notes` | `text` | sim |  |  |  |
| 11 | `effectiveness_rating` | `integer` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_communication_logs_communication_outcome_check | CHECK | `CHECK (communication_outcome = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))` |  |  | sim |
| disc_communication_logs_contact_disc_profile_check | CHECK | `CHECK (contact_disc_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_communication_logs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_communication_logs_effectiveness_rating_check | CHECK | `CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5)` |  |  | sim |
| disc_communication_logs_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| disc_communication_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_communication_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_communication_logs_pkey ON _dormant.disc_communication_logs USING btree (id)` |
| idx_disc_communication_logs_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_disc_communication_logs_contact ON _dormant.disc_communication_logs USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own DISC communication logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own disc_communication_logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own DISC communication logs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own DISC communication logs`

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

_nenhum_
