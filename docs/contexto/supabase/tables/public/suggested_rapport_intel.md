# public.suggested_rapport_intel

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
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `type` | `text` | não |  |  |  |
| 5 | `value` | `text` | não |  |  |  |
| 6 | `source` | `text` | não |  |  |  |
| 7 | `status` | `text` | não | `'pending'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| suggested_rapport_intel_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| suggested_rapport_intel_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| suggested_rapport_intel_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))` |  |  | sim |
| suggested_rapport_intel_type_check | CHECK | `CHECK (type = ANY (ARRAY['hobby'::text, 'interest'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_suggested_rapport_contact | btree | contact_id, status | não | sim |  | `CREATE INDEX idx_suggested_rapport_contact ON public.suggested_rapport_intel USING btree (contact_id, status)` |
| suggested_rapport_intel_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX suggested_rapport_intel_pkey ON public.suggested_rapport_intel USING btree (id)` |


## Policies (RLS)

### `System/Users can insert suggested rapport`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM contacts   WHERE (contacts.id = suggested_rapport_intel.contact_id)))` |

### `Users can manage their suggested rapport`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update status of suggested rapport`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts   WHERE (contacts.id = suggested_rapport_intel.contact_id)))` |
| WITH CHECK |  |

### `Users can view suggested rapport for their contacts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM contacts   WHERE (contacts.id = suggested_rapport_intel.contact_id)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_suggested_rapport_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |
| update_suggested_rapport_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
