# _dormant.hidden_objections

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
| 5 | `objection_type` | `text` | não |  |  |  |
| 6 | `indicator` | `text` | não |  |  |  |
| 7 | `probability` | `integer` | sim | `50` |  |  |
| 8 | `severity` | `text` | não |  |  |  |
| 9 | `possible_real_objection` | `text` | sim |  |  |  |
| 10 | `suggested_probe` | `text` | sim |  |  |  |
| 11 | `resolution_templates` | `text[]` | sim |  |  |  |
| 12 | `resolved` | `boolean` | sim | `false` |  |  |
| 13 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| hidden_objections_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| hidden_objections_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| hidden_objections_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| hidden_objections_probability_check | CHECK | `CHECK (probability >= 0 AND probability <= 100)` |  |  | sim |
| hidden_objections_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| hidden_objections_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX hidden_objections_pkey ON _dormant.hidden_objections USING btree (id)` |
| idx_hidden_objections_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_hidden_objections_contact ON _dormant.hidden_objections USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own hidden objections`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own hidden objections`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own hidden objections`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own hidden objections`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
