# _dormant.contact_relationships

> SINGU: Mapeamento de relacionamentos entre contatos

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
| 3 | `contact_a_id` | `uuid` | não |  |  |  |
| 4 | `contact_b_id` | `uuid` | não |  |  |  |
| 5 | `relationship_type` | `text` | não |  |  |  |
| 6 | `direction` | `text` | sim | `'bidirectional'::text` |  |  |
| 7 | `strength` | `integer` | sim | `5` |  |  |
| 8 | `influence_type` | `text` | sim |  |  |  |
| 9 | `context` | `text` | sim |  |  |  |
| 10 | `discovered_via` | `text` | sim |  |  |  |
| 11 | `is_verified` | `boolean` | sim | `false` |  |  |
| 12 | `verified_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `is_active` | `boolean` | sim | `true` |  |  |
| 14 | `ended_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `notes` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_relationships_contact_a_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_a_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_relationships_contact_b_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_b_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_relationships_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['a_to_b'::text, 'b_to_a'::text, 'bidirectional'::text]))` |  |  | sim |
| contact_relationships_discovered_via_check | CHECK | `CHECK (discovered_via = ANY (ARRAY['manual'::text, 'conversation'::text, 'social_media'::text, 'company_structure'::text, 'referral'::text, 'ai_inference'::text]))` |  |  | sim |
| contact_relationships_influence_type_check | CHECK | `CHECK (influence_type = ANY (ARRAY['decision_maker'::text, 'technical'::text, 'financial'::text, 'personal'::text, 'professional'::text, 'social'::text]))` |  |  | sim |
| contact_relationships_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_relationships_relationship_type_check | CHECK | `CHECK (relationship_type = ANY (ARRAY['colleague'::text, 'manager_report'::text, 'business_partner'::text, 'family'::text, 'friend'::text, 'referral'::text, 'competitor'::text, 'vendor_client'::text, 'mentor_mentee'::text, 'other'::text]))` |  |  | sim |
| contact_relationships_strength_check | CHECK | `CHECK (strength >= 0 AND strength <= 10)` |  |  | sim |
| contact_relationships_user_id_contact_a_id_contact_b_id_rel_key | UNIQUE | `UNIQUE (user_id, contact_a_id, contact_b_id, relationship_type)` |  |  | sim |
| contact_relationships_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_relationships_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_relationships_pkey ON _dormant.contact_relationships USING btree (id)` |
| contact_relationships_user_id_contact_a_id_contact_b_id_rel_key | btree | user_id, contact_a_id, contact_b_id, relationship_type | sim | sim |  | `CREATE UNIQUE INDEX contact_relationships_user_id_contact_a_id_contact_b_id_rel_key ON _dormant.contact_relationships USING btree (user_id, contact_a_id, contact_b_id, relationship_type)` |


## Policies (RLS)

### `dormant_deny_all_contact_relationships`

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
