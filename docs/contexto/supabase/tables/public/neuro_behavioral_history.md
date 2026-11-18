# public.neuro_behavioral_history

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `dominance_data` | `jsonb` | sim |  |  |  |
| 4 | `neuromarketing_data` | `jsonb` | sim |  |  |  |
| 5 | `empathy_score` | `numeric` | sim |  |  |  |
| 6 | `recommendations` | `text[]` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `empathy_trend` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 9 | `language_complexity_score` | `double precision` | sim | `0.0` |  |  |
| 10 | `response_synchronicity` | `double precision` | sim | `0.0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| neuro_behavioral_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| neuro_behavioral_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_neuro_history_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_neuro_history_contact_id ON public.neuro_behavioral_history USING btree (contact_id)` |
| neuro_behavioral_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX neuro_behavioral_history_pkey ON public.neuro_behavioral_history USING btree (id)` |


## Policies (RLS)

### `Users can insert their own contact's neuro history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |

### `Users can view their own contact's neuro history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
