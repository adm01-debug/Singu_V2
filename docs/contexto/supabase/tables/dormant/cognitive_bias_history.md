# _dormant.cognitive_bias_history

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
| 5 | `detected_biases` | `jsonb` | não |  |  |  |
| 6 | `category_distribution` | `jsonb` | sim |  |  |  |
| 7 | `dominant_biases` | `text[]` | sim |  |  |  |
| 8 | `vulnerabilities` | `text[]` | sim |  |  |  |
| 9 | `resistances` | `text[]` | sim |  |  |  |
| 10 | `sales_strategies` | `jsonb` | sim |  |  |  |
| 11 | `profile_summary` | `text` | sim |  |  |  |
| 12 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cognitive_bias_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cognitive_bias_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| cognitive_bias_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cognitive_bias_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cognitive_bias_history_pkey ON _dormant.cognitive_bias_history USING btree (id)` |
| idx_cognitive_bias_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_cognitive_bias_history_contact_id ON _dormant.cognitive_bias_history USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own cognitive bias history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own cognitive bias history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own cognitive_bias_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own cognitive bias history`

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
