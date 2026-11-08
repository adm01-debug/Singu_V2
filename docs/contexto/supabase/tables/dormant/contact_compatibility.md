# _dormant.contact_compatibility

> SINGU: Análise de compatibilidade DISC entre usuário e contato

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
| 4 | `user_disc_profile` | `text` | sim |  |  |  |
| 5 | `contact_disc_profile` | `text` | sim |  |  |  |
| 6 | `compatibility_score` | `integer` | sim |  |  |  |
| 7 | `communication_compatibility` | `integer` | sim |  |  |  |
| 8 | `decision_style_compatibility` | `integer` | sim |  |  |  |
| 9 | `pace_compatibility` | `integer` | sim |  |  |  |
| 10 | `attention_points` | `text[]` | sim | `'{}'::text[]` |  |  |
| 11 | `communication_tips` | `text[]` | sim | `'{}'::text[]` |  |  |
| 12 | `suggested_strategy` | `text` | sim |  |  |  |
| 13 | `calculated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_compatibility_communication_compatibility_check | CHECK | `CHECK (communication_compatibility >= 0 AND communication_compatibility <= 100)` |  |  | sim |
| contact_compatibility_compatibility_score_check | CHECK | `CHECK (compatibility_score >= 0 AND compatibility_score <= 100)` |  |  | sim |
| contact_compatibility_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_compatibility_decision_style_compatibility_check | CHECK | `CHECK (decision_style_compatibility >= 0 AND decision_style_compatibility <= 100)` |  |  | sim |
| contact_compatibility_pace_compatibility_check | CHECK | `CHECK (pace_compatibility >= 0 AND pace_compatibility <= 100)` |  |  | sim |
| contact_compatibility_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_compatibility_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_compatibility_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_compatibility_pkey ON _dormant.contact_compatibility USING btree (id)` |
| idx_compatibility_unique | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_compatibility_unique ON _dormant.contact_compatibility USING btree (user_id, contact_id)` |


## Policies (RLS)

### `dormant_deny_all_contact_compatibility`

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
