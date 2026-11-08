# _dormant.vak_analysis_history

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
| 5 | `visual_score` | `numeric(5,2)` | sim | `0` |  |  |
| 6 | `auditory_score` | `numeric(5,2)` | sim | `0` |  |  |
| 7 | `kinesthetic_score` | `numeric(5,2)` | sim | `0` |  |  |
| 8 | `digital_score` | `numeric(5,2)` | sim | `0` |  |  |
| 9 | `visual_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 10 | `auditory_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 11 | `kinesthetic_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 12 | `digital_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 13 | `analyzed_text` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| vak_analysis_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| vak_analysis_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| vak_analysis_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_vak_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_vak_analysis_contact ON _dormant.vak_analysis_history USING btree (contact_id)` |
| vak_analysis_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX vak_analysis_history_pkey ON _dormant.vak_analysis_history USING btree (id)` |


## Policies (RLS)

### `Users can delete their own VAK analysis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert their own VAK analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own vak_analysis_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own VAK analysis`

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
