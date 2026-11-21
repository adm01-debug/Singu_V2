# public.neuro_pnl_sessions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `conversation_id` | `text` | sim |  |  |  |
| 5 | `session_date` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `technique_used` | `text` | sim |  |  |  |
| 7 | `results_summary` | `text` | sim |  |  |  |
| 8 | `emotional_state_before` | `text` | sim |  |  |  |
| 9 | `emotional_state_after` | `text` | sim |  |  |  |
| 10 | `anchors_installed` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `next_steps` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| neuro_pnl_sessions_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| neuro_pnl_sessions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| neuro_pnl_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_neuro_pnl_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_neuro_pnl_contact_id ON public.neuro_pnl_sessions USING btree (contact_id)` |
| neuro_pnl_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX neuro_pnl_sessions_pkey ON public.neuro_pnl_sessions USING btree (id)` |


## Policies (RLS)

### `Owner or admin can insert neuro pnl sessions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Users can update neuro pnl sessions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |

### `Users can view neuro pnl sessions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_neuro_pnl_sessions | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
