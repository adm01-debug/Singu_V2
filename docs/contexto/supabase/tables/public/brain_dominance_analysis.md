# public.brain_dominance_analysis

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
| 3 | `reptilian_score` | `integer` | sim | `0` |  |  |
| 4 | `limbic_score` | `integer` | sim | `0` |  |  |
| 5 | `neocortex_score` | `integer` | sim | `0` |  |  |
| 6 | `dominant_system` | `text` | sim |  |  |  |
| 7 | `recommendations` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `negotiation_tips` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 9 | `analyzed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| brain_dominance_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| brain_dominance_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| brain_dominance_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX brain_dominance_analysis_pkey ON public.brain_dominance_analysis USING btree (id)` |
| idx_brain_dominance_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_brain_dominance_contact_id ON public.brain_dominance_analysis USING btree (contact_id)` |


## Policies (RLS)

### `Owner or admin can insert brain dominance analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Users can update brain dominance analysis`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |

### `Users can view brain dominance analysis`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_brain_dominance | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
