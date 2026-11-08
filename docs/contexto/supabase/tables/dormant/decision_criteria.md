# _dormant.decision_criteria

> SINGU: Critérios de decisão de compra por contato

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `criterion` | `text` | não |  |  |  |
| 5 | `criterion_type` | `text` | sim |  |  |  |
| 6 | `weight` | `integer` | sim | `5` |  |  |
| 7 | `our_position` | `text` | sim |  |  |  |
| 8 | `notes` | `text` | sim |  |  |  |
| 9 | `evidence` | `text` | sim |  |  |  |
| 10 | `discovered_in_interaction_id` | `uuid` | sim |  |  |  |
| 11 | `is_active` | `boolean` | sim | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| decision_criteria_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| decision_criteria_criterion_type_check | CHECK | `CHECK (criterion_type = ANY (ARRAY['must_have'::text, 'nice_to_have'::text, 'differentiator'::text, 'deal_breaker'::text]))` |  |  | sim |
| decision_criteria_discovered_in_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (discovered_in_interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| decision_criteria_our_position_check | CHECK | `CHECK (our_position = ANY (ARRAY['strong'::text, 'adequate'::text, 'weak'::text, 'unknown'::text]))` |  |  | sim |
| decision_criteria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| decision_criteria_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| decision_criteria_weight_check | CHECK | `CHECK (weight >= 1 AND weight <= 10)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| decision_criteria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX decision_criteria_pkey ON _dormant.decision_criteria USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_decision_criteria`

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

_nenhum_
