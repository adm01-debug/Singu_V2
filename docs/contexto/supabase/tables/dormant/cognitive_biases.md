# _dormant.cognitive_biases

> SINGU: Vieses cognitivos detectados por contato

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
| 4 | `bias_type` | `text` | não |  |  |  |
| 5 | `strength` | `integer` | sim | `5` |  |  |
| 6 | `evidence` | `text` | sim |  |  |  |
| 7 | `leverage_strategy` | `text` | sim |  |  |  |
| 8 | `detected_in_interaction_id` | `uuid` | sim |  |  |  |
| 9 | `times_observed` | `integer` | sim | `1` |  |  |
| 10 | `is_validated` | `boolean` | sim | `false` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cognitive_biases_bias_type_check | CHECK | `CHECK (bias_type = ANY (ARRAY['anchoring'::text, 'confirmation'::text, 'availability'::text, 'bandwagon'::text, 'loss_aversion'::text, 'status_quo'::text, 'framing'::text, 'authority'::text, 'social_proof'::text, 'scarcity'::text, 'reciprocity'::text, 'sunk_cost'::text, 'halo_effect'::text, 'other'::text]))` |  |  | sim |
| cognitive_biases_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cognitive_biases_detected_in_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (detected_in_interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| cognitive_biases_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cognitive_biases_strength_check | CHECK | `CHECK (strength >= 1 AND strength <= 10)` |  |  | sim |
| cognitive_biases_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cognitive_biases_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cognitive_biases_pkey ON _dormant.cognitive_biases USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_cognitive_biases`

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
