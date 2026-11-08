# public.contact_business_context

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
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `financial_health` | `text` | sim |  |  |  |
| 4 | `current_challenges` | `text[]` | sim |  |  |  |
| 5 | `competitors_used` | `text[]` | sim |  |  |  |
| 6 | `best_moment_to_approach` | `text` | sim |  |  |  |
| 7 | `seasonal_notes` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_business_context_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_business_context_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_business_context_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_business_context_contact_id_key ON public.contact_business_context USING btree (contact_id)` |
| contact_business_context_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_business_context_pkey ON public.contact_business_context USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete contact_business_context`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can insert contact_business_context`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can select contact_business_context`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can update contact_business_context`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| log_contact_business_change | AFTER | UPDATE | ROW | enabled | public.log_behavioral_change |
| update_contact_business_context_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
